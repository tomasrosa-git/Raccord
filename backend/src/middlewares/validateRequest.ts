import type { RequestHandler } from 'express';
import type { ZodType, z } from 'zod';
import { AppError } from '../shared/errors/AppError';

/**
 * Parsea datos contra un schema de zod o tira AppError 400.
 * Para params/query usar esto dentro del controller: en Express 5 son
 * getters y mutarlos desde un middleware no es confiable.
 */
export function parsear<S extends ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw AppError.badRequest(
      'Datos inválidos',
      result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))
    );
  }
  return result.data;
}

type RequestPart = 'body' | 'params' | 'query';

/**
 * Valida una parte del request contra un schema de zod.
 * El resultado parseado reemplaza al original (aplica defaults y coerciones).
 */
export function validateRequest(schema: ZodType, part: RequestPart = 'body'): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(
        AppError.badRequest(
          'Datos inválidos',
          result.error.issues.map((i) => ({
            campo: i.path.join('.'),
            mensaje: i.message,
          }))
        )
      );
      return;
    }
    Object.assign(req[part] as object, result.data);
    next();
  };
}
