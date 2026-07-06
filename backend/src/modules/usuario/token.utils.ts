import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import type { Rol } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // usuarioId
  rol: Rol;
}

export function firmarAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'] });
}

export function verificarAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

/** Genera un refresh token opaco. Se envía al cliente tal cual; solo el hash se persiste. */
export function generarRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashearRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function calcularExpiracionRefreshToken(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DIAS);
  return expiresAt;
}
