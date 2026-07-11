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
import { verificarTokenGoogle } from './google.utils';
import type { RegistroInput, LoginInput } from './usuario.schema';

const SALT_ROUNDS = 12;

/**
 * Deriva un username válido y libre a partir del email o el nombre de Google.
 * Sanea a `[a-z0-9_]`, respeta el largo del schema (3–30) y desambigua con un
 * sufijo numérico si la base ya está tomada.
 */
async function generarUsernameUnico(base: string): Promise<string> {
  let raiz = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
  if (raiz.length < 3) raiz = `user${raiz}`;
  raiz = raiz.slice(0, 24); // deja lugar para el sufijo

  let candidato = raiz;
  let intento = 0;
  while (await usuarioRepository.buscarPorUsername(candidato)) {
    intento += 1;
    candidato = `${raiz}${intento}`;
  }
  return candidato;
}

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

    // Cuenta creada solo con Google: no tiene contraseña propia.
    if (!usuario.passwordHash) {
      throw AppError.unauthorized('Esta cuenta se creó con Google. Ingresá con Google.');
    }

    const passwordValida = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!passwordValida) throw AppError.unauthorized('Email o contraseña incorrectos');

    return emitirSesion(usuario);
  },

  async loginConGoogle(credential: string) {
    const perfil = await verificarTokenGoogle(credential);

    // 1) Ya existe una cuenta vinculada a este Google: se usa directamente.
    const porGoogle = await usuarioRepository.buscarPorGoogleId(perfil.googleId);
    if (porGoogle) return emitirSesion(porGoogle);

    // 2) Existe una cuenta con ese email (registro por contraseña): se vincula.
    //    Solo si Google confirma que el email está verificado, para no dejar
    //    que un tercero se apropie de una cuenta ajena vía un email no probado.
    const porEmail = await usuarioRepository.buscarPorEmail(perfil.email);
    if (porEmail) {
      if (!perfil.emailVerificado) {
        throw AppError.conflict('Ya existe una cuenta con ese email. Ingresá con tu contraseña.');
      }
      const vinculado = await usuarioRepository.vincularGoogle(
        porEmail.id,
        perfil.googleId,
        porEmail.avatarUrl ? undefined : perfil.avatarUrl
      );
      return emitirSesion(vinculado);
    }

    // 3) Usuario nuevo: se crea sin contraseña, con un username derivado.
    const base = perfil.nombre || perfil.email.split('@')[0] || 'user';
    const username = await generarUsernameUnico(base);
    const usuario = await usuarioRepository.crearConGoogle({
      email: perfil.email,
      username,
      googleId: perfil.googleId,
      avatarUrl: perfil.avatarUrl,
    });
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
