import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/errors/AppError';

const peliculaResumen = {
  select: { id: true, titulo: true, posterUrl: true, fechaEstreno: true, duracionMin: true },
};

async function asegurarPelicula(peliculaId: string) {
  const pelicula = await prisma.pelicula.findUnique({ where: { id: peliculaId }, select: { id: true } });
  if (!pelicula) throw AppError.notFound('Película no encontrada');
}

export const watchlistService = {
  async agregar(usuarioId: string, peliculaId: string) {
    await asegurarPelicula(peliculaId);
    await prisma.watchlistItem.upsert({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      update: {},
      create: { usuarioId, peliculaId },
    });
  },

  async quitar(usuarioId: string, peliculaId: string) {
    await prisma.watchlistItem.deleteMany({ where: { usuarioId, peliculaId } });
  },

  listar(usuarioId: string) {
    return prisma.watchlistItem.findMany({
      where: { usuarioId },
      include: { pelicula: peliculaResumen },
      orderBy: { addedAt: 'desc' },
    });
  },
};

export const likesService = {
  async agregar(usuarioId: string, peliculaId: string) {
    await asegurarPelicula(peliculaId);
    await prisma.like.upsert({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      update: {},
      create: { usuarioId, peliculaId },
    });
  },

  async quitar(usuarioId: string, peliculaId: string) {
    await prisma.like.deleteMany({ where: { usuarioId, peliculaId } });
  },

  listar(usuarioId: string) {
    return prisma.like.findMany({
      where: { usuarioId },
      include: { pelicula: peliculaResumen },
      orderBy: { createdAt: 'desc' },
    });
  },
};

/** Estado del usuario sobre una película (para pintar los toggles). */
export async function estadoSobrePelicula(usuarioId: string, peliculaId: string) {
  const [enWatchlist, conLike, vista] = await Promise.all([
    prisma.watchlistItem.findUnique({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      select: { usuarioId: true },
    }),
    prisma.like.findUnique({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      select: { usuarioId: true },
    }),
    prisma.visto.findUnique({
      where: { usuarioId_peliculaId: { usuarioId, peliculaId } },
      select: { usuarioId: true },
    }),
  ]);
  return { enWatchlist: !!enWatchlist, conLike: !!conLike, vista: !!vista };
}
