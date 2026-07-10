import { prisma } from '../../config/prisma';

/**
 * Tamaño del pool de Frame Guess: las N películas más populares que cumplen los
 * requisitos. Acota el juego a títulos reconocibles (adivinar un corto oscuro no
 * es un juego, es una lotería) y a la vez marca cuántos días tarda en repetirse
 * un fotograma.
 */
const POOL_FRAME_GUESS = 200;

/** Duración mínima: deja afuera los cortos, que el catálogo tiene muchos. */
const MIN_DURACION_MIN = 60;

export const juegosRepository = {
  /**
   * Pool de películas elegibles para Frame Guess: largometrajes con fotograma,
   * los más populares del catálogo. Se reordena por id — orden estable, ajeno a
   * los vaivenes de la popularidad, que es lo que hace reproducible la elección
   * del día.
   */
  async peliculasParaFrameGuess() {
    const populares = await prisma.pelicula.findMany({
      where: {
        backdropUrl: { not: null },
        popularity: { not: null },
        duracionMin: { gte: MIN_DURACION_MIN },
      },
      select: { id: true, titulo: true, backdropUrl: true, fechaEstreno: true, posterUrl: true },
      orderBy: { popularity: 'desc' },
      take: POOL_FRAME_GUESS,
    });

    return populares.sort((a, b) => a.id.localeCompare(b.id));
  },

  /**
   * Pool del Duelo de popularidad: largometrajes con póster y popularidad.
   * Acá no se acota a los más populares — comparar dos títulos no exige
   * recordarlos, así que la variedad suma.
   */
  peliculasParaDuelo() {
    return prisma.pelicula.findMany({
      where: {
        posterUrl: { not: null },
        popularity: { not: null },
        duracionMin: { gte: MIN_DURACION_MIN },
      },
      select: { id: true, titulo: true, posterUrl: true, fechaEstreno: true, popularity: true },
    });
  },
};
