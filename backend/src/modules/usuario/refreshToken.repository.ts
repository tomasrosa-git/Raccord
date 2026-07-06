import { prisma } from '../../config/prisma';

export const refreshTokenRepository = {
  crear(data: { tokenHash: string; usuarioId: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  buscarPorHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revocar(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revocado: true },
    });
  },

  revocarTodosDelUsuario(usuarioId: string) {
    return prisma.refreshToken.updateMany({
      where: { usuarioId, revocado: false },
      data: { revocado: true },
    });
  },
};
