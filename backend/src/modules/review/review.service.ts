import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import type { CrearReviewInput, EditarReviewInput } from './review.schema';

const usuarioPublico = { select: { id: true, username: true, avatarUrl: true } };

export const reviewService = {
  async listarDePelicula(peliculaId: string) {
    const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId }, select: { id: true } });
    if (!pelicula) throw AppError.notFound('Película no encontrada');

    return prisma.review.findMany({
      where: { peliculaId },
      include: { usuario: usuarioPublico },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  async crear(usuarioId: string, peliculaId: string, input: CrearReviewInput) {
    const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId }, select: { id: true } });
    if (!pelicula) throw AppError.notFound('Película no encontrada');

    try {
      return await prisma.review.create({
        data: { usuarioId, peliculaId, ...input },
        include: { usuario: usuarioPublico },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw AppError.conflict('Ya escribiste una reseña de esta película');
      }
      throw err;
    }
  },

  async editar(usuarioId: string, reviewId: string, input: EditarReviewInput) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Reseña no encontrada');
    if (review.usuarioId !== usuarioId) throw AppError.forbidden('La reseña no es tuya');

    return prisma.review.update({
      where: { id: reviewId },
      data: input,
      include: { usuario: usuarioPublico },
    });
  },

  async eliminar(usuarioId: string, rol: string, reviewId: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Reseña no encontrada');
    if (review.usuarioId !== usuarioId && rol !== 'ADMIN') {
      throw AppError.forbidden('La reseña no es tuya');
    }
    await prisma.review.delete({ where: { id: reviewId } });
  },

  listarDeUsuario(usuarioId: string) {
    return prisma.review.findMany({
      where: { usuarioId },
      include: {
        pelicula: { select: { id: true, titulo: true, posterUrl: true, fechaEstreno: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
