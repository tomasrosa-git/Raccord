import { AppError } from '../../shared/errors/AppError';
import { conCache } from '../../shared/utils/cache';
import { CACHE_TTL_SEGUNDOS } from '../../config/constants';
import { peliculaRepository } from './pelicula.repository';
import type { ListarPeliculasQuery } from './pelicula.schema';

const MAX_SIMILARES = 10;
const TOP_POR_DECADA = 6;

export const peliculaService = {
  async listar(query: ListarPeliculasQuery) {
    const { items, total } = await peliculaRepository.listar(query);
    return {
      items: items.map((p) => ({
        ...p,
        generos: p.generos.map((g) => g.genero.nombre),
      })),
      total,
      pagina: query.pagina,
      limite: query.limite,
      totalPaginas: Math.ceil(total / query.limite),
    };
  },

  /** Opciones de los filtros de /explorar. Cacheado: cambia solo al ampliar el catálogo. */
  obtenerFacetas() {
    return conCache('peliculas:facetas', CACHE_TTL_SEGUNDOS.decadas, () =>
      peliculaRepository.facetas()
    );
  },

  async obtenerDetalle(id: string) {
    const pelicula = await peliculaRepository.buscarDetallePorId(id);
    if (!pelicula) throw AppError.notFound('Película no encontrada');

    const { creditos, generos, ...datos } = pelicula;
    const cast = creditos
      .filter((c) => c.rol === 'ACTOR')
      .sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99))
      .map((c) => ({ ...c.persona, personaje: c.personaje }));
    const directores = creditos.filter((c) => c.rol === 'DIRECTOR').map((c) => c.persona);
    const crew = creditos
      .filter((c) => c.rol !== 'ACTOR' && c.rol !== 'DIRECTOR')
      .map((c) => ({ ...c.persona, rol: c.rol }));

    return {
      ...datos,
      generos: generos.map((g) => g.genero),
      directores,
      cast,
      crew,
    };
  },

  /**
   * Similares por afinidad: +1 por género compartido, +1 si comparten director
   * (un bonus mayor hace que la lista repita la filmografía del director).
   * A esta escala (cientos de películas) el ranking en memoria es más simple
   * y flexible que una query agregada.
   */
  async obtenerSimilares(id: string) {
    const pelicula = await peliculaRepository.buscarDetallePorId(id);
    if (!pelicula) throw AppError.notFound('Película no encontrada');

    const generoIds = pelicula.generos.map((g) => g.genero.id);
    const directorIds = new Set(
      pelicula.creditos.filter((c) => c.rol === 'DIRECTOR').map((c) => c.persona.id)
    );
    if (generoIds.length === 0) return [];

    const candidatas = await peliculaRepository.buscarCandidatasSimilares(id, generoIds);

    return candidatas
      .map((c) => {
        const generosCompartidos = c.generos.filter((g) => generoIds.includes(g.generoId)).length;
        const mismoDirector = c.creditos.some((cr) => directorIds.has(cr.personaId));
        return {
          id: c.id,
          titulo: c.titulo,
          fechaEstreno: c.fechaEstreno,
          duracionMin: c.duracionMin,
          posterUrl: c.posterUrl,
          generos: c.generos.map((g) => g.genero.nombre),
          score: generosCompartidos + (mismoDirector ? 1 : 0),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SIMILARES)
      .map(({ score: _score, ...similar }) => similar);
  },

  async obtenerPaleta(id: string) {
    const existe = await peliculaRepository.existe(id);
    if (!existe) throw AppError.notFound('Película no encontrada');
    return peliculaRepository.buscarPaleta(id);
  },

  /**
   * "Lo más importante por década": top de películas por popularidad de TMDB,
   * agrupadas por década de estreno, en orden cronológico. A esta escala
   * (cientos de películas) el agrupado en memoria + cache alcanza de sobra.
   */
  obtenerPorDecada() {
    return conCache('peliculas:por-decada', CACHE_TTL_SEGUNDOS.decadas, async () => {
      const peliculas = await peliculaRepository.listarConPopularidad();

      const porDecada = new Map<number, typeof peliculas>();
      for (const p of peliculas) {
        const decada = Math.floor(p.fechaEstreno!.getFullYear() / 10) * 10;
        if (!porDecada.has(decada)) porDecada.set(decada, []);
        porDecada.get(decada)!.push(p);
      }

      return [...porDecada.entries()]
        .sort(([a], [b]) => a - b)
        .map(([decada, pelis]) => ({
          decada,
          peliculas: pelis
            .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
            .slice(0, TOP_POR_DECADA)
            .map(({ popularity: _p, generos, ...datos }) => ({
              ...datos,
              generos: generos.map((g) => g.genero.nombre),
            })),
        }));
    });
  },
};
