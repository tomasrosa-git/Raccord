import type { RolCredito } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const personaRepository = {
  buscarPorId(id: string) {
    return prisma.persona.findUnique({
      where: { id },
      include: {
        estilos: { select: { tag: { select: { id: true, nombre: true } } } },
      },
    });
  },

  existe(id: string) {
    return prisma.persona.findUnique({ where: { id }, select: { id: true } });
  },

  buscarFilmografia(personaId: string, rol?: RolCredito) {
    return prisma.creditoPelicula.findMany({
      where: { personaId, ...(rol && { rol }) },
      select: {
        rol: true,
        personaje: true,
        pelicula: {
          select: {
            id: true,
            titulo: true,
            fechaEstreno: true,
            duracionMin: true,
            posterUrl: true,
          },
        },
      },
      orderBy: { pelicula: { fechaEstreno: { sort: 'asc', nulls: 'last' } } },
    });
  },

  buscarPremios(personaId: string) {
    return prisma.premioGanado.findMany({
      where: { personaId },
      select: {
        anio: true,
        ganador: true,
        premio: { select: { nombre: true, categoria: true } },
        pelicula: { select: { id: true, titulo: true } },
      },
      orderBy: { anio: 'desc' },
    });
  },

  buscarEtapasCarrera(personaId: string) {
    return prisma.etapaCarrera.findMany({
      where: { personaId },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        anioInicio: true,
        anioFin: true,
      },
      orderBy: { anioInicio: 'asc' },
    });
  },

  seguir(usuarioId: string, personaId: string) {
    return prisma.seguidorPersona.upsert({
      where: { usuarioId_personaId: { usuarioId, personaId } },
      update: {},
      create: { usuarioId, personaId },
    });
  },

  dejarDeSeguir(usuarioId: string, personaId: string) {
    return prisma.seguidorPersona.deleteMany({ where: { usuarioId, personaId } });
  },
};
