import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../shared/errors/AppError';

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
