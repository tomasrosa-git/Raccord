import bcrypt from 'bcryptjs';
import { AppError } from '../../shared/errors/AppError';
import { usuarioRepository } from './usuario.repository';
import { refreshTokenRepository } from './refreshToken.repository';
import {
  firmarAccessToken,
  generarRefreshToken,
  hashearRefreshToken,
  calcularExpiracionRefreshToken,
} from './token.utils';
import type { RegistroInput, LoginInput } from './usuario.schema';

const SALT_ROUNDS = 12;

interface SesionEmitida {
  usuario: {
    id: string;
    email: string;
    username: string;
    rol: string;
  };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

async function emitirSesion(usuario: { id: string; email: string; username: string; rol: 'USUARIO' | 'ADMIN' }): Promise<SesionEmitida> {
  const accessToken = firmarAccessToken({ sub: usuario.id, rol: usuario.rol });

  const refreshToken = generarRefreshToken();
  const refreshExpiresAt = calcularExpiracionRefreshToken();
  await refreshTokenRepository.crear({
    tokenHash: hashearRefreshToken(refreshToken),
    usuarioId: usuario.id,
    expiresAt: refreshExpiresAt,
  });

  return {
    usuario: { id: usuario.id, email: usuario.email, username: usuario.username, rol: usuario.rol },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

export const authService = {
  async registrar(input: RegistroInput) {
    const [emailExistente, usernameExistente] = await Promise.all([
      usuarioRepository.buscarPorEmail(input.email),
      usuarioRepository.buscarPorUsername(input.username),
    ]);

    if (emailExistente) throw AppError.conflict('Ya existe una cuenta con ese email');
    if (usernameExistente) throw AppError.conflict('Ese nombre de usuario ya está en uso');

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const usuario = await usuarioRepository.crear({
      email: input.email,
      username: input.username,
      passwordHash,
    });

    return emitirSesion(usuario);
  },

  async login(input: LoginInput) {
    const usuario = await usuarioRepository.buscarPorEmail(input.email);
    if (!usuario) throw AppError.unauthorized('Email o contraseña incorrectos');

    const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!passwordValida) throw AppError.unauthorized('Email o contraseña incorrectos');

    return emitirSesion(usuario);
  },

  async refrescar(refreshTokenPlano: string) {
    const tokenHash = hashearRefreshToken(refreshTokenPlano);
    const registro = await refreshTokenRepository.buscarPorHash(tokenHash);

    if (!registro) throw AppError.unauthorized('Sesión inválida');

    if (registro.revocado) {
      // Reuso de un token ya rotado/revocado: posible robo de token.
      // Se invalidan todas las sesiones del usuario por seguridad.
      await refreshTokenRepository.revocarTodosDelUsuario(registro.usuarioId);
      throw AppError.unauthorized('Sesión inválida, iniciá sesión nuevamente');
    }

    if (registro.expiresAt < new Date()) {
      throw AppError.unauthorized('Sesión expirada');
    }

    const usuario = await usuarioRepository.buscarPorId(registro.usuarioId);
    if (!usuario) throw AppError.unauthorized('Sesión inválida');

    // Rotación: se revoca el token usado y se emite uno nuevo.
    await refreshTokenRepository.revocar(registro.id);

    return emitirSesion(usuario);
  },

  async logout(refreshTokenPlano: string) {
    const tokenHash = hashearRefreshToken(refreshTokenPlano);
    const registro = await refreshTokenRepository.buscarPorHash(tokenHash);
    if (registro && !registro.revocado) {
      await refreshTokenRepository.revocar(registro.id);
    }
  },
};
