// Llamadas de auth desde el navegador. El refresh token viaja en una cookie
// httpOnly (credentials: 'include'); el access token vive solo en memoria.

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Usuario {
  id: string;
  email: string;
  username: string;
  rol: 'USUARIO' | 'ADMIN';
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface Sesion {
  usuario: Usuario;
  accessToken: string;
}

async function postAuth(path: string, body?: unknown): Promise<Response> {
  return fetch(`${API_URL}/api/auth${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function leerSesion(res: Response): Promise<Sesion> {
  const datos = (await res.json().catch(() => null)) as
    | (Sesion & { error?: string })
    | { error: string }
    | null;
  if (!res.ok || !datos || 'error' in datos) {
    throw new Error((datos as { error?: string } | null)?.error ?? 'Algo falló, probá de nuevo');
  }
  return datos as Sesion;
}

export async function loginApi(email: string, password: string): Promise<Sesion> {
  return leerSesion(await postAuth('/login', { email, password }));
}

export async function registroApi(
  email: string,
  username: string,
  password: string
): Promise<Sesion> {
  return leerSesion(await postAuth('/registro', { email, username, password }));
}

/** Devuelve null si no hay cookie de sesión válida. */
export async function refreshApi(): Promise<Sesion | null> {
  const res = await postAuth('/refresh');
  if (!res.ok) return null;
  return (await res.json()) as Sesion;
}

export async function logoutApi(): Promise<void> {
  await postAuth('/logout');
}
