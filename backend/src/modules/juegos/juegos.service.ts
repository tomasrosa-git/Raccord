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

function solucionDe(pelicula: Awaited<ReturnType<typeof peliculaDelDia>>) {
  return {
    id: pelicula.id,
    titulo: pelicula.titulo,
    fechaEstreno: pelicula.fechaEstreno,
    posterUrl: pelicula.posterUrl,
  };
}
