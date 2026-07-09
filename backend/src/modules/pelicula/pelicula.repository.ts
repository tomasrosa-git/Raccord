import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { ListarPeliculasQuery } from './pelicula.schema';

function filtrosDeListado(query: ListarPeliculasQuery): Prisma.PeliculaWhereInput {
  return {
    ...(query.anio && {
      fechaEstreno: {
        gte: new Date(`${query.anio}-01-01T00:00:00Z`),
        lt: new Date(`${query.anio + 1}-01-01T00:00:00Z`),
      },
    }),
    ...(query.genero && {
      generos: {
        some: { genero: { nombre: { equals: query.genero, mode: 'insensitive' as const } } },
      },
    }),
  };
}

const resumenSelect = {
  id: true,
  titulo: true,
  fechaEstreno: true,
  duracionMin: true,
  posterUrl: true,
  generos: { select: { genero: { select: { nombre: true } } } },
} satisfies Prisma.PeliculaSelect;

export const peliculaRepository = {
  async listar(query: ListarPeliculasQuery) {
    const where = filtrosDeListado(query);
    const [items, total] = await Promise.all([
      prisma.pelicula.findMany({
        where,
        select: resumenSelect,
        orderBy: { fechaEstreno: { sort: 'desc', nulls: 'last' } },
        skip: (query.pagina - 1) * query.limite,
        take: query.limite,
      }),
      prisma.pelicula.count({ where }),
    ]);
    return { items, total };
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
