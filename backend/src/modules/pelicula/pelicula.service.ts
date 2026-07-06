import { AppError } from '../../shared/errors/AppError';
import { peliculaRepository } from './pelicula.repository';
import type { ListarPeliculasQuery } from './pelicula.schema';

const MAX_SIMILARES = 10;

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
};
