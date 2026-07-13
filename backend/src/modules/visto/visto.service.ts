import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';

const peliculaResumen = {
  select: { id: true, titulo: true, posterUrl: true, fechaEstreno: true, duracionMin: true },
};

async function asegurarPelicula(peliculaId: string) {
  const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId }, select: { id: true } });
  if (!pelicula) throw AppError.notFound('Película no encontrada');
}

export const vistoService = {
  async agregar(usuarioId: string, peliculaId: string) {
    await asegurarPelicula(peliculaId);
    await prisma.visto.upsert({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      update: {},
      create: { usuarioId, peliculaId },
    });
  },

  async quitar(usuarioId: string, peliculaId: string) {
    await prisma.visto.deleteMany({ where: { usuarioId, peliculaId } });
  },

  listar(usuarioId: string) {
    return prisma.visto.findMany({
      where: { usuarioId },
      include: { pelicula: peliculaResumen },
      orderBy: { createdAt: 'desc' },
    });
  },
};
