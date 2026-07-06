import type { RequestHandler } from 'express';
import { usuarioRepository } from './usuario.repository';
import { AppError } from '../../shared/errors/AppError';

export const me: RequestHandler = async (req, res, next) => {
  try {
    const usuario = await usuarioRepository.buscarPorId(req.usuario!.id);
    if (!usuario) throw AppError.notFound('Usuario no encontrado');

    res.json({
      id: usuario.id,
      email: usuario.email,
      username: usuario.username,
      avatarUrl: usuario.avatarUrl,
      bio: usuario.bio,
      rol: usuario.rol,
      createdAt: usuario.createdAt,
    });
  } catch (err) {
    next(err);
  }
};
