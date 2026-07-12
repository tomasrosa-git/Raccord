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

  // La mayoría de las 274 personas con crédito de dirección lo tienen por una
  // sola película incidental (un montajista que dirigió un corto, etc.); el
  // umbral deja solo directores con presencia real en el catálogo.
  MIN_PELICULAS_DIRECTOR: 2,

  /** Directores con presencia real (>= MIN películas), con su cantidad de películas dirigidas. */
  async listarDirectores() {
    const conteos = await prisma.creditoPelicula.groupBy({
      by: ['personaId'],
      where: { rol: 'DIRECTOR' },
      _count: { peliculaId: true },
      having: { peliculaId: { _count: { gte: this.MIN_PELICULAS_DIRECTOR } } },
    });
    const porPersona = new Map(conteos.map((c) => [c.personaId, c._count.peliculaId]));

    const personas = await prisma.persona.findMany({
      where: { id: { in: [...porPersona.keys()] } },
      select: { id: true, nombre: true, fotoUrl: true },
    });

    return personas
      .map((p) => ({ ...p, peliculasDirigidas: porPersona.get(p.id) ?? 0 }))
      .sort((a, b) => b.peliculasDirigidas - a.peliculasDirigidas || a.nombre.localeCompare(b.nombre));
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

  async estaSiguiendo(usuarioId: string, personaId: string) {
    const rel = await prisma.seguidorPersona.findUnique({
      where: { usuarioId_personaId: { usuarioId, personaId } },
      select: { personaId: true },
    });
    return rel !== null;
  },

  async estaEnPanteon(usuarioId: string, personaId: string) {
    const rel = await prisma.directorFavorito.findUnique({
      where: { usuarioId_personaId: { usuarioId, personaId } },
      select: { id: true },
    });
    return rel !== null;
  },
};
