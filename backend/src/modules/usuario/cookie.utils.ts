import type { Response } from 'express';
import { env } from '../../config/env';

export const REFRESH_COOKIE_NAME = 'raccord_refresh_token';

const cookieOpciones = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
};

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...cookieOpciones, expires: expiresAt });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, cookieOpciones);
}
