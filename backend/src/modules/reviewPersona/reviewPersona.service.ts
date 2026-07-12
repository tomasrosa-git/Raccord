import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';
import type { CrearReviewPersonaInput, EditarReviewPersonaInput } from './reviewPersona.schema';

const usuarioPublico = { select: { id: true, username: true, avatarUrl: true } };

async function asegurarPersona(personaId: string) {
  const persona = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true } });
  if (!persona) throw AppError.notFound('Cineasta no encontrado');
}

export const reviewPersonaService = {
  async listarDePersona(personaId: string) {
    await asegurarPersona(personaId);
    return prisma.reviewPersona.findMany({
      where: { personaId },
      include: { usuario: usuarioPublico },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  async crear(usuarioId: string, personaId: string, input: CrearReviewPersonaInput) {
    await asegurarPersona(personaId);
    try {
      return await prisma.reviewPersona.create({
        data: { usuarioId, personaId, ...input },
        include: { usuario: usuarioPublico },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw AppError.conflict('Ya escribiste una reseña de este cineasta');
      }
      throw err;
    }
  },

  async editar(usuarioId: string, reviewId: string, input: EditarReviewPersonaInput) {
    const review = await prisma.reviewPersona.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Reseña no encontrada');
    if (review.usuarioId !== usuarioId) throw AppError.forbidden('La reseña no es tuya');

    return prisma.reviewPersona.update({
      where: { id: reviewId },
      data: input,
      include: { usuario: usuarioPublico },
    });
  },

  async eliminar(usuarioId: string, rol: string, reviewId: string) {
    const review = await prisma.reviewPersona.findUnique({ where: { id: reviewId } });
    if (!review) throw AppError.notFound('Reseña no encontrada');
    if (review.usuarioId !== usuarioId && rol !== 'ADMIN') {
      throw AppError.forbidden('La reseña no es tuya');
    }
    await prisma.reviewPersona.delete({ where: { id: reviewId } });
  },

  listarDeUsuario(usuarioId: string) {
    return prisma.reviewPersona.findMany({
      where: { usuarioId },
      include: { persona: { select: { id: true, nombre: true, fotoUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
};
