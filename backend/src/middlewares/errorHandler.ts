import type { ErrorRequestHandler } from 'express';
import { AppError } from '../shared/errors/AppError';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.detalles !== undefined && { detalles: err.detalles }),
    });
    return;
  }

  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(env.NODE_ENV === 'development' &&
      err instanceof Error && { detalles: err.message }),
  });
};
