import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import { personaRepository } from '../persona/persona.repository';

// Tope del panteón: es una selección curada, no una lista larga.
const MAX_PANTEON = 12;

const personaMini = { select: { id: true, nombre: true, fotoUrl: true } };
const peliculaMini = { select: { id: true, titulo: true, posterUrl: true, fechaEstreno: true } };

const incluirEntrada = { persona: personaMini, pelicula: peliculaMini };

export const panteonService = {
  listar(usuarioId: string) {
    return prisma.directorFavorito.findMany({
      where: { usuarioId },
      include: incluirEntrada,
      orderBy: { orden: 'asc' },
    });
  },

  async agregar(usuarioId: string, personaId: string) {
    const persona = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true } });
    if (!persona) throw AppError.notFound('Cineasta no encontrado');

    const total = await prisma.directorFavorito.count({ where: { usuarioId } });
    if (total >= MAX_PANTEON) {
      throw AppError.conflict(`El panteón admite hasta ${MAX_PANTEON} directores`);
    }

    try {
      return await prisma.directorFavorito.create({
        data: { usuarioId, personaId, orden: total },
        include: incluirEntrada,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw AppError.conflict('Ese director ya está en tu panteón');
      }
      throw err;
    }
  },

  async quitar(usuarioId: string, personaId: string) {
    const { count } = await prisma.directorFavorito.deleteMany({ where: { usuarioId, personaId } });
    if (count === 0) throw AppError.notFound('Ese director no está en tu panteón');
    // Compactar el orden para que no queden huecos.
    const resto = await prisma.directorFavorito.findMany({
      where: { usuarioId },
      orderBy: { orden: 'asc' },
      select: { id: true },
    });
    await prisma.$transaction(
      resto.map((e, i) =>
        prisma.directorFavorito.update({ where: { id: e.id }, data: { orden: i } })
      )
    );
  },

  async setPeliculaFavorita(usuarioId: string, personaId: string, peliculaFavoritaId: string | null) {
    const entrada = await prisma.directorFavorito.findUnique({
      where: { usuarioId_personaId: { usuarioId, personaId } },
      select: { id: true },
    });
    if (!entrada) throw AppError.notFound('Ese director no está en tu panteón');

    if (peliculaFavoritaId) {
      // La película tiene que ser de ese director (crédito de dirección).
      const credito = await prisma.creditoPelicula.findFirst({
        where: { peliculaId: peliculaFavoritaId, personaId, rol: 'DIRECTOR' },
        select: { id: true },
      });
      if (!credito) throw AppError.badRequest('Esa película no es de ese director');
    }

    return prisma.directorFavorito.update({
      where: { id: entrada.id },
      data: { peliculaFavoritaId },
      include: incluirEntrada,
    });
  },

  async reordenar(usuarioId: string, personaIds: string[]) {
    const actuales = await prisma.directorFavorito.findMany({
      where: { usuarioId },
      select: { personaId: true },
    });
    const setActual = new Set(actuales.map((e) => e.personaId));
    // El nuevo orden tiene que ser exactamente los mismos directores del panteón.
    const mismoConjunto =
      personaIds.length === setActual.size && personaIds.every((id) => setActual.has(id));
    if (!mismoConjunto) throw AppError.badRequest('El orden no coincide con tu panteón');

    await prisma.$transaction(
      personaIds.map((personaId, i) =>
        prisma.directorFavorito.update({
          where: { usuarioId_personaId: { usuarioId, personaId } },
          data: { orden: i },
        })
      )
    );
    return this.listar(usuarioId);
  },

  /** Perfil público de un usuario por username: panteón + números de actividad. */
  async perfilPublico(username: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { username },
      select: { id: true, username: true, avatarUrl: true, bio: true, createdAt: true },
    });
    if (!usuario) throw AppError.notFound('Usuario no encontrado');

    const [panteonSinProgreso, reviews, reviewsPersona, siguiendo, likes] = await Promise.all([
      prisma.directorFavorito.findMany({
        where: { usuarioId: usuario.id },
        include: incluirEntrada,
        orderBy: { orden: 'asc' },
      }),
      prisma.review.count({ where: { usuarioId: usuario.id } }),
      prisma.reviewPersona.count({ where: { usuarioId: usuario.id } }),
      prisma.seguidorPersona.count({ where: { usuarioId: usuario.id } }),
      prisma.like.count({ where: { usuarioId: usuario.id } }),
    ]);

    // Completista: cuántas de las películas de cada director ya vio el dueño del perfil.
    const panteon = await Promise.all(
      panteonSinProgreso.map(async (entrada) => ({
        ...entrada,
        progreso: await personaRepository.progresoFilmografia(usuario.id, entrada.personaId),
      }))
    );

    return {
      usuario,
      panteon,
      stats: { reviews, reviewsPersona, siguiendo, likes },
    };
  },
};
