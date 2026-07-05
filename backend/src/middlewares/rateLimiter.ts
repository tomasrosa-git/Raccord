import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_LOGIN } from '../config/constants';

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_LOGIN.windowMs,
  limit: RATE_LIMIT_LOGIN.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Probá de nuevo más tarde.' },
});
