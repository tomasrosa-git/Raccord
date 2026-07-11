import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  UMBRALES_DURACION,
  MIN_VOTOS_RANKING,
  type ListarPeliculasQuery,
  type OrdenListado,
} from './pelicula.schema';

const esOrdenPorValoracion = (orden: OrdenListado) =>
  orden === 'valoracion_desc' || orden === 'valoracion_asc';

function filtrosDeListado(query: ListarPeliculasQuery): Prisma.PeliculaWhereInput {
  return {
    ...(query.decada && {
      fechaEstreno: {
        gte: new Date(`${query.decada}-01-01T00:00:00Z`),
        lt: new Date(`${query.decada + 10}-01-01T00:00:00Z`),
      },
    }),
    ...(query.genero && {
      generos: {
        some: { genero: { nombre: { equals: query.genero, mode: 'insensitive' as const } } },
      },
    }),
    ...(query.duracion && { duracionMin: UMBRALES_DURACION[query.duracion] }),
    // Ordenar por valoración solo tiene sentido sobre películas con votos suficientes.
    ...(esOrdenPorValoracion(query.orden) && { votoConteo: { gte: MIN_VOTOS_RANKING } }),
  };
}

/** Traduce el orden de la UI a un orderBy de Prisma; los nulos van siempre al final. */
function ordenDeListado(orden: OrdenListado): Prisma.PeliculaOrderByWithRelationInput {
  switch (orden) {
    case 'estreno_asc':
      return { fechaEstreno: { sort: 'asc', nulls: 'last' } };
    case 'valoracion_desc':
      return { votoPromedio: { sort: 'desc', nulls: 'last' } };
    case 'valoracion_asc':
      return { votoPromedio: { sort: 'asc', nulls: 'last' } };
    case 'duracion_desc':
      return { duracionMin: { sort: 'desc', nulls: 'last' } };
    case 'duracion_asc':
      return { duracionMin: { sort: 'asc', nulls: 'last' } };
    case 'titulo_asc':
      return { titulo: 'asc' };
    case 'estreno_desc':
    default:
      return { fechaEstreno: { sort: 'desc', nulls: 'last' } };
  }
}

const resumenSelect = {
  id: true,
  titulo: true,
  fechaEstreno: true,
  duracionMin: true,
  posterUrl: true,
  votoPromedio: true,
  generos: { select: { genero: { select: { nombre: true } } } },
} satisfies Prisma.PeliculaSelect;

export const peliculaRepository = {
  async listar(query: ListarPeliculasQuery) {
    const where = filtrosDeListado(query);
    const [items, total] = await Promise.all([
      prisma.pelicula.findMany({
        where,
        select: resumenSelect,
        orderBy: ordenDeListado(query.orden),
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      prisma.pelicula.count({ where }),
    ]);
    return { items, total };
  },

  /**
   * Insumo de los filtros de /explorar: géneros existentes (con conteo, para
   * ordenarlos por relevancia) y el rango de años del catálogo (para derivar
   * las décadas disponibles). Solo cuenta películas con estreno conocido.
   */
  async facetas() {
    const [generos, rango] = await Promise.all([
      prisma.genero.findMany({
        select: { nombre: true, _count: { select: { peliculas: true } } },
        orderBy: { peliculas: { _count: 'desc' } },
      }),
      prisma.pelicula.aggregate({
        where: { fechaEstreno: { not: null } },
        _min: { fechaEstreno: true },
        _max: { fechaEstreno: true },
      }),
    ]);
    return {
      generos: generos.filter((g) => g._count.peliculas > 0).map((g) => g.nombre),
      anioMin: rango._min.fechaEstreno?.getFullYear() ?? null,
      anioMax: rango._max.fechaEstreno?.getFullYear() ?? null,
    };
  },

  /** Películas con fecha y popularidad conocidas — insumo de "por década". */
  listarConPopularidad() {
    return prisma.pelicula.findMany({
      where: { popularity: { not: null }, fechaEstreno: { not: null } },
      select: { ...resumenSelect, popularity: true },
    });
  },

  buscarDetallePorId(id: string) {
    return prisma.pelicula.findUnique({
      where: { id },
      include: {
        generos: { select: { genero: { select: { id: true, nombre: true } } } },
        creditos: {
          select: {
            rol: true,
            personaje: true,
            orden: true,
            persona: { select: { id: true, nombre: true, fotoUrl: true } },
          },
        },
      },
    });
  },

  /** Candidatas a similares: comparten al menos un género (el score se calcula en el service). */
  buscarCandidatasSimilares(peliculaId: string, generoIds: string[]) {
    return prisma.pelicula.findMany({
      where: {
        id: { not: peliculaId },
        generos: { some: { generoId: { in: generoIds } } },
      },
      select: {
        ...resumenSelect,
        generos: { select: { generoId: true, genero: { select: { nombre: true } } } },
        creditos: {
          where: { rol: 'DIRECTOR' },
          select: { personaId: true },
        },
      },
    });
  },

  buscarPaleta(peliculaId: string) {
    return prisma.colorPaleta.findMany({
      where: { peliculaId },
      select: { colorHex: true, porcentaje: true, stillUrl: true },
      orderBy: { porcentaje: 'desc' },
    });
  },

  existe(id: string) {
    return prisma.pelicula.findUnique({ where: { id }, select: { id: true } });
  },
};
