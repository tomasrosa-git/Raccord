import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_LOGIN, RATE_LIMIT_API } from '../config/constants';

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_LOGIN.windowMs,
  limit: RATE_LIMIT_LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo más tarde.' },
});

// Límite general para toda la API pública (por IP). El login además tiene su
// propio limiter, más estricto, apilado encima.
export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_API.windowMs,
  limit: RATE_LIMIT_API.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Probá de nuevo en un momento.' },
});
