import type { RequestHandler } from 'express';
import { AppError } from '../shared/errors/AppError';
import { verificarAccessToken } from '../modules/usuario/token.utils';
import type { Rol } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: string; rol: Rol };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(AppError.unauthorized());
    return;
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = verificarAccessToken(token);
    req.usuario = { id: payload.sub, rol: payload.rol };
    next();
  } catch {
    next(AppError.unauthorized('Token inválido o expirado'));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.usuario?.rol !== 'ADMIN') {
    next(AppError.forbidden());
    return;
  }
  next();
};
