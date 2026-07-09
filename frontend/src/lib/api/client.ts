const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** GET tipado contra la API de Raccord. `revalidate` controla el cache de Next. */
export async function apiGet<T>(
  path: string,
  opciones: { revalidate?: number; token?: string } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...(opciones.revalidate !== undefined && { next: { revalidate: opciones.revalidate } }),
    headers: opciones.token ? { Authorization: `Bearer ${opciones.token}` } : undefined,
  });

  if (!res.ok) {
    const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, cuerpo?.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** POST tipado, sin cache. Para acciones — ej. los intentos de los juegos. */
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    cache: 'no-store',
    ...(body !== undefined && {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  });

  if (!res.ok) {
    const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(res.status, cuerpo?.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
