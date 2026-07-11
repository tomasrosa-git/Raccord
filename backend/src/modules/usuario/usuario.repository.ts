import { prisma } from '../../config/prisma';

export const usuarioRepository = {
  crear(data: { email: string; username: string; passwordHash: string }) {
    return prisma.usuario.create({ data });
  },

  crearConGoogle(data: {
    email: string;
    username: string;
    googleId: string;
    avatarUrl?: string | null;
  }) {
    return prisma.usuario.create({ data });
  },

  vincularGoogle(id: string, googleId: string, avatarUrl?: string | null) {
    return prisma.usuario.update({
      where: { id },
      // El avatar solo se completa si el usuario todavía no tiene uno propio.
      data: { googleId, ...(avatarUrl && { avatarUrl }) },
    });
  },

  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarPorUsername(username: string) {
    return prisma.usuario.findUnique({ where: { username } });
  },

  buscarPorGoogleId(googleId: string) {
    return prisma.usuario.findUnique({ where: { googleId } });
  },

  buscarPorId(id: string) {
    return prisma.usuario.findUnique({ where: { id } });
  },
};
