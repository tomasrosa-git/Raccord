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

function solucionDe(pelicula: Awaited<ReturnType<typeof peliculaDelDia>>) {
  return {
    id: pelicula.id,
    titulo: pelicula.titulo,
    fechaEstreno: pelicula.fechaEstreno,
    posterUrl: pelicula.posterUrl,
  };
}
