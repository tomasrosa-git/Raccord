import { AppError } from '../../shared/errors/AppError';
import { conCache } from '../../shared/utils/cache';
import { CACHE_TTL_SEGUNDOS } from '../../config/constants';
import { juegosRepository } from './juegos.repository';

export const FRAME_GUESS_MAX_INTENTOS = 5;

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en Argentina como "YYYY-MM-DD" (el juego cambia a medianoche ART). */
export function fechaDeHoy(): string {
  // "en-CA" formatea como YYYY-MM-DD; evita depender de una librería de fechas.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
}

/** Días transcurridos desde el epoch para una fecha "YYYY-MM-DD". */
function diaAbsoluto(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return Math.floor(Date.UTC(anio!, mes! - 1, dia!) / 86_400_000);
}

// Paso del recorrido cíclico. Primo y mayor que cualquier tamaño de pool
// realista, así que siempre es coprimo con él: `dia * PASO % n` recorre los n
// índices sin repetir ninguno antes de agotarlos. (Un hash de la fecha era más
// simple, pero muestrea con reemplazo: repetía película dentro del mismo mes.)
const PASO = 1_000_003;
// Desplaza el arranque del ciclo por juego: dos juegos diarios distintos no
// caen en la misma película el mismo día.
const OFFSET_FRAME_GUESS = 31;

/**
 * Película del día para Frame Guess. Determinística por fecha: no hace falta ni
 * tabla ni cron — el mismo día devuelve la misma película para todos, y a la
 * medianoche de Buenos Aires cambia sola.
 */
async function peliculaDelDia(fecha: string) {
  const pool = await conCache('juegos:pool-frame-guess', CACHE_TTL_SEGUNDOS.juegos, () =>
    juegosRepository.peliculasParaFrameGuess()
  );
  if (pool.length === 0) throw AppError.notFound('No hay películas con fotograma disponibles');

  const indice = ((diaAbsoluto(fecha) + OFFSET_FRAME_GUESS) * PASO) % pool.length;
  return pool[indice]!;
}

export const juegosService = {
  /** Lo que ve el jugador al abrir: el fotograma, nada que identifique la película. */
  async frameGuessDeHoy() {
    const fecha = fechaDeHoy();
    const pelicula = await peliculaDelDia(fecha);
    return {
      fecha,
      backdropUrl: pelicula.backdropUrl,
      maxIntentos: FRAME_GUESS_MAX_INTENTOS,
    };
  },

  /**
   * Valida un intento contra la película del día. La solución solo se devuelve
   * cuando el jugador acierta — nunca viaja al cliente antes.
   */
  async frameGuessIntentar(peliculaId: string) {
    const pelicula = await peliculaDelDia(fechaDeHoy());
    const correcto = pelicula.id === peliculaId;
    return { correcto, solucion: correcto ? solucionDe(pelicula) : null };
  },

  /** El jugador se quedó sin intentos (o abandona): recién ahí se revela. */
  async frameGuessSolucion() {
    const pelicula = await peliculaDelDia(fechaDeHoy());
    return solucionDe(pelicula);
  },
};

// --- Duelo de popularidad -------------------------------------------------

/**
 * Diferencia mínima de popularidad entre las dos películas de un duelo. Sin
 * esto, ~8% de los pares aleatorios quedan tan parejos que acertar es cuestión
 * de suerte, no de criterio.
 */
const RATIO_MINIMO = 1.2;
const INTENTOS_PAR = 40;

const alAzar = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]!;

type PeliculaDuelo = Awaited<ReturnType<typeof juegosRepository.peliculasParaDuelo>>[number];

async function poolDuelo() {
  const pool = await conCache('juegos:pool-duelo', CACHE_TTL_SEGUNDOS.juegos, () =>
    juegosRepository.peliculasParaDuelo()
  );
  if (pool.length < 2) throw AppError.notFound('No hay suficientes películas para el duelo');
  return pool;
}

/** Sin la popularidad: es justo lo que el jugador tiene que adivinar. */
const sinPopularidad = ({ popularity: _p, ...datos }: PeliculaDuelo) => datos;

export const duelo = {
  async nuevaRonda() {
    const pool = await poolDuelo();

    let a = alAzar(pool);
    let b = alAzar(pool);
    for (let i = 0; i < INTENTOS_PAR; i++) {
      const ratio = Math.max(a.popularity!, b.popularity!) / Math.min(a.popularity!, b.popularity!);
      if (a.id !== b.id && Number.isFinite(ratio) && ratio >= RATIO_MINIMO) break;
      a = alAzar(pool);
      b = alAzar(pool);
    }

    return { a: sinPopularidad(a), b: sinPopularidad(b) };
  },

  /**
   * Ronda encadenada: el jugador conserva la película que ganó y enfrenta una
   * sola rival nueva (mecánica higher/lower). Así la racha se construye
   * defendiendo al mismo campeón, en vez de arrancar de cero con dos películas
   * nuevas cada vez.
   */
  async siguienteRonda(conservarId: string) {
    const pool = await poolDuelo();
    const campeon = pool.find((p) => p.id === conservarId);
    if (!campeon) throw AppError.notFound('Película no encontrada en el duelo');

    const candidatos = pool.filter((p) => p.id !== conservarId);
    let rival = alAzar(candidatos);
    for (let i = 0; i < INTENTOS_PAR; i++) {
      const ratio =
        Math.max(campeon.popularity!, rival.popularity!) /
        Math.min(campeon.popularity!, rival.popularity!);
      if (Number.isFinite(ratio) && ratio >= RATIO_MINIMO) break;
      rival = alAzar(candidatos);
    }

    return { rival: sinPopularidad(rival) };
  },

  /** Valida la elección contra la popularidad real, que nunca salió del server. */
  async resolver(aId: string, bId: string, elegidaId: string) {
    if (aId === bId) throw AppError.badRequest('Las películas del duelo deben ser distintas');
    if (elegidaId !== aId && elegidaId !== bId) {
      throw AppError.badRequest('La elección debe ser una de las dos películas');
    }

    const pool = await poolDuelo();
    const a = pool.find((p) => p.id === aId);
    const b = pool.find((p) => p.id === bId);
    if (!a || !b) throw AppError.notFound('Película no encontrada en el duelo');

    const ganadora = a.popularity! >= b.popularity! ? a : b;
    return {
      correcto: ganadora.id === elegidaId,
      ganadoraId: ganadora.id,
      popularidad: { [a.id]: a.popularity, [b.id]: b.popularity } as Record<string, number | null>,
    };
  },
};

// --- Duelo de taquilla ----------------------------------------------------

/**
 * Diferencia mínima de recaudación entre las dos películas. Más laxo que en
 * popularidad (1.2): la taquilla se reparte en órdenes de magnitud muy amplios,
 * y exigir un 20% de diferencia dejaría afuera comparaciones interesantes entre
 * dos taquillazos parejos.
 */
const RATIO_MINIMO_TAQUILLA = 1.15;

type PeliculaDueloTaquilla = Awaited<
  ReturnType<typeof juegosRepository.peliculasParaDueloTaquilla>
>[number];

async function poolDueloTaquilla() {
  const pool = await conCache('juegos:pool-duelo-taquilla', CACHE_TTL_SEGUNDOS.juegos, () =>
    juegosRepository.peliculasParaDueloTaquilla()
  );
  if (pool.length < 2) throw AppError.notFound('No hay suficientes películas para el duelo');
  return pool;
}

/** Sin la recaudación: es justo lo que el jugador tiene que adivinar. */
const sinRecaudacion = ({ recaudacion: _r, ...datos }: PeliculaDueloTaquilla) => datos;

export const dueloTaquilla = {
  async nuevaRonda() {
    const pool = await poolDueloTaquilla();

    let a = alAzar(pool);
    let b = alAzar(pool);
    for (let i = 0; i < INTENTOS_PAR; i++) {
      const ratio =
        Math.max(a.recaudacion!, b.recaudacion!) / Math.min(a.recaudacion!, b.recaudacion!);
      if (a.id !== b.id && Number.isFinite(ratio) && ratio >= RATIO_MINIMO_TAQUILLA) break;
      a = alAzar(pool);
      b = alAzar(pool);
    }

    return { a: sinRecaudacion(a), b: sinRecaudacion(b) };
  },

  /** Ronda encadenada: se conserva el campeón y aparece una sola rival nueva. */
  async siguienteRonda(conservarId: string) {
    const pool = await poolDueloTaquilla();
    const campeon = pool.find((p) => p.id === conservarId);
    if (!campeon) throw AppError.notFound('Película no encontrada en el duelo');

    const candidatos = pool.filter((p) => p.id !== conservarId);
    let rival = alAzar(candidatos);
    for (let i = 0; i < INTENTOS_PAR; i++) {
      const ratio =
        Math.max(campeon.recaudacion!, rival.recaudacion!) /
        Math.min(campeon.recaudacion!, rival.recaudacion!);
      if (Number.isFinite(ratio) && ratio >= RATIO_MINIMO_TAQUILLA) break;
      rival = alAzar(candidatos);
    }

    return { rival: sinRecaudacion(rival) };
  },

  /** Valida la elección contra la recaudación real, que nunca salió del server. */
  async resolver(aId: string, bId: string, elegidaId: string) {
    if (aId === bId) throw AppError.badRequest('Las películas del duelo deben ser distintas');
    if (elegidaId !== aId && elegidaId !== bId) {
      throw AppError.badRequest('La elección debe ser una de las dos películas');
    }

    const pool = await poolDueloTaquilla();
    const a = pool.find((p) => p.id === aId);
    const b = pool.find((p) => p.id === bId);
    if (!a || !b) throw AppError.notFound('Película no encontrada en el duelo');

    const ganadora = a.recaudacion! >= b.recaudacion! ? a : b;
    return {
      correcto: ganadora.id === elegidaId,
      ganadoraId: ganadora.id,
      recaudacion: { [a.id]: a.recaudacion, [b.id]: b.recaudacion } as Record<
        string,
        number | null
      >,
    };
  },
};

function solucionDe(pelicula: Awaited<ReturnType<typeof peliculaDelDia>>) {
  return {
    id: pelicula.id,
    titulo: pelicula.titulo,
    fechaEstreno: pelicula.fechaEstreno,
    posterUrl: pelicula.posterUrl,
  };
}

// --- El Intruso -----------------------------------------------------------

export const CATEGORIAS_INTRUSO = ['director', 'protagonista', 'decada', 'genero'] as const;
export type CategoriaIntruso = (typeof CATEGORIAS_INTRUSO)[number];

/** Texto que se le muestra al jugador: "Tres de estas cuatro …". */
const ETIQUETA_INTRUSO: Record<CategoriaIntruso, string> = {
  director: 'comparten director',
  protagonista: 'comparten protagonista',
  decada: 'son de la misma década',
  genero: 'comparten género',
};

const INTENTOS_RONDA = 60;

interface PeliIntruso {
  id: string;
  titulo: string;
  posterUrl: string | null;
  directorIds: string[];
  protagIds: string[];
  generoIds: string[];
  decada: number | null;
}

/** Valores por los que agrupa cada categoría (un director, varios géneros, etc.). */
function valoresDe(p: PeliIntruso, cat: CategoriaIntruso): (string | number)[] {
  switch (cat) {
    case 'director':
      return p.directorIds;
    case 'protagonista':
      return p.protagIds;
    case 'genero':
      return p.generoIds;
    case 'decada':
      return p.decada != null ? [p.decada] : [];
  }
}

/**
 * Dadas 4 películas y una categoría, la intrusa es la única que no comparte el
 * valor que las otras tres sí. Devuelve null si la ronda es ambigua (ningún
 * valor aparece en exactamente 3, o aparece más de uno) — eso descarta la
 * combinación al armarla.
 */
function calcularIntrusa(cuatro: PeliIntruso[], cat: CategoriaIntruso): string | null {
  const frecuencia = new Map<string | number, number>();
  for (const peli of cuatro) {
    for (const valor of new Set(valoresDe(peli, cat))) {
      frecuencia.set(valor, (frecuencia.get(valor) ?? 0) + 1);
    }
  }
  const enTres = [...frecuencia.entries()].filter(([, n]) => n === 3).map(([v]) => v);
  if (enTres.length !== 1) return null;

  const comun = enTres[0]!;
  const intrusas = cuatro.filter((p) => !valoresDe(p, cat).includes(comun));
  return intrusas.length === 1 ? intrusas[0]!.id : null;
}

async function catalogoIntruso(): Promise<PeliIntruso[]> {
  return conCache('juegos:catalogo-intruso', CACHE_TTL_SEGUNDOS.juegos, async () => {
    const pelis = await juegosRepository.peliculasParaIntruso();
    return pelis.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      posterUrl: p.posterUrl,
      directorIds: p.creditos.filter((c) => c.rol === 'DIRECTOR').map((c) => c.personaId),
      protagIds: p.creditos.filter((c) => c.rol === 'ACTOR').map((c) => c.personaId),
      generoIds: p.generos.map((g) => g.generoId),
      decada: p.fechaEstreno ? Math.floor(p.fechaEstreno.getFullYear() / 10) * 10 : null,
    }));
  });
}

function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  }
  return copia;
}

/** Intenta armar una ronda 3+1 inequívoca para una categoría; null si no puede. */
function armarRonda(catalogo: PeliIntruso[], cat: CategoriaIntruso): PeliIntruso[] | null {
  // valor → películas que lo tienen; grupos = valores presentes en >= 3.
  const porValor = new Map<string | number, PeliIntruso[]>();
  for (const peli of catalogo) {
    for (const valor of new Set(valoresDe(peli, cat))) {
      (porValor.get(valor) ?? porValor.set(valor, []).get(valor)!).push(peli);
    }
  }
  const grupos = [...porValor.entries()].filter(([, pelis]) => pelis.length >= 3);
  if (grupos.length === 0) return null;

  for (let intento = 0; intento < INTENTOS_RONDA; intento++) {
    const [valor, pelis] = grupos[Math.floor(Math.random() * grupos.length)]!;
    const tres = mezclar(pelis).slice(0, 3);
    const usados = new Set(tres.map((p) => p.id));

    const intrusas = catalogo.filter(
      (p) => !usados.has(p.id) && !valoresDe(p, cat).includes(valor)
    );
    if (intrusas.length === 0) continue;
    const intrusa = intrusas[Math.floor(Math.random() * intrusas.length)]!;

    const cuatro = mezclar([...tres, intrusa]);
    // Auto-verificación: la combinación tiene que resolver a esta misma intrusa,
    // sin ambigüedad. Si otra terna comparte otro valor, se descarta y reintenta.
    if (calcularIntrusa(cuatro, cat) === intrusa.id) return cuatro;
  }
  return null;
}

const sinAtributos = (p: PeliIntruso) => ({ id: p.id, titulo: p.titulo, posterUrl: p.posterUrl });

export const intruso = {
  async nuevaRonda() {
    const catalogo = await catalogoIntruso();
    if (catalogo.length < 4) throw AppError.notFound('No hay suficientes películas para el juego');

    // Se prueban las categorías en orden aleatorio hasta que una arme ronda.
    for (const cat of mezclar([...CATEGORIAS_INTRUSO])) {
      const cuatro = armarRonda(catalogo, cat);
      if (cuatro) {
        return {
          categoria: cat,
          etiqueta: ETIQUETA_INTRUSO[cat],
          peliculas: cuatro.map(sinAtributos),
        };
      }
    }
    throw AppError.notFound('No se pudo armar una ronda');
  },

  /** Re-deriva la intrusa desde el catálogo: cuál es nunca viajó al cliente. */
  async resolver(ids: string[], categoria: CategoriaIntruso, elegidaId: string) {
    const unicos = new Set(ids);
    if (ids.length !== 4 || unicos.size !== 4) {
      throw AppError.badRequest('La ronda debe tener cuatro películas distintas');
    }
    if (!unicos.has(elegidaId)) {
      throw AppError.badRequest('La elección debe ser una de las cuatro películas');
    }

    const catalogo = await catalogoIntruso();
    const porId = new Map(catalogo.map((p) => [p.id, p]));
    const cuatro = ids.map((id) => porId.get(id));
    if (cuatro.some((p) => !p)) throw AppError.notFound('Película no encontrada en la ronda');

    const intrusaId = calcularIntrusa(cuatro as PeliIntruso[], categoria);
    if (!intrusaId) throw AppError.badRequest('Ronda inválida');

    return { correcto: intrusaId === elegidaId, intrusaId };
  },
};
