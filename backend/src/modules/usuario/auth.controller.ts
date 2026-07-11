import type { RequestHandler } from 'express';
import { authService } from './auth.service';
import { AppError } from '../../shared/errors/AppError';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from './cookie.utils';
import type { RegistroInput, LoginInput, GoogleInput } from './usuario.schema';

export const registro: RequestHandler<unknown, unknown, RegistroInput> = async (req, res, next) => {
  try {
    const { refreshToken, refreshExpiresAt, ...sesion } = await authService.registrar(req.body);
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.status(201).json(sesion);
  } catch (err) {
    next(err);
  }
};

export const login: RequestHandler<unknown, unknown, LoginInput> = async (req, res, next) => {
  try {
    const { refreshToken, refreshExpiresAt, ...sesion } = await authService.login(req.body);
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.json(sesion);
  } catch (err) {
    next(err);
  }
};

export const google: RequestHandler<unknown, unknown, GoogleInput> = async (req, res, next) => {
  try {
    const { refreshToken, refreshExpiresAt, ...sesion } = await authService.loginConGoogle(
      req.body.credential
    );
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.json(sesion);
  } catch (err) {
    next(err);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const tokenActual = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!tokenActual) throw AppError.unauthorized('No hay sesión activa');

    const { refreshToken, refreshExpiresAt, ...sesion } = await authService.refrescar(tokenActual);
    setRefreshCookie(res, refreshToken, refreshExpiresAt);
    res.json(sesion);
  } catch (err) {
    next(err);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) await authService.logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
