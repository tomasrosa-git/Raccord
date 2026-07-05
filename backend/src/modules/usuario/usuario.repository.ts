import { prisma } from '../../config/prisma';

export const usuarioRepository = {
  crear(data: { email: string; username: string; passwordHash: string }) {
    return prisma.usuario.create({ data });
  },

  buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  buscarPorUsername(username: string) {
    return prisma.usuario.findUnique({ where: { username } });
  },

  buscarPorId(id: string) {
    return prisma.usuario.findUnique({ where: { id } });
  },
};
