import { OAuth2Client } from 'google-auth-library';
import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';

export interface PerfilGoogle {
  googleId: string;
  email: string;
  emailVerificado: boolean;
  nombre?: string;
  avatarUrl?: string;
}

// Un único cliente reutilizable; solo se usa para verificar la firma del token.
const client = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

/**
 * Verifica el ID token que emite Google Identity Services en el navegador:
 * comprueba la firma, el emisor y que la `audience` sea nuestro Client ID.
 * Devuelve el perfil mínimo que necesitamos para vincular o crear la cuenta.
 */
export async function verificarTokenGoogle(credential: string): Promise<PerfilGoogle> {
  if (!client || !env.GOOGLE_CLIENT_ID) {
    throw AppError.badRequest('El inicio de sesión con Google no está configurado');
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw AppError.unauthorized('No se pudo validar la sesión de Google');
  }

  if (!payload?.sub || !payload.email) {
    throw AppError.unauthorized('La respuesta de Google es inválida');
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerificado: payload.email_verified === true,
    nombre: payload.name,
    avatarUrl: payload.picture,
  };
}
