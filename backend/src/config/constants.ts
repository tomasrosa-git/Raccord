export const API_PREFIX = '/api';

export const CACHE_TTL_SEGUNDOS = {
  colaboradores: 3600,
  firmaVisual: 3600,
  decadas: 3600,
  juegos: 3600,
  // La disponibilidad en streaming cambia de a días, no de a minutos: 6 h
  // alcanza y evita pegarle a TMDB por cada visita a una ficha.
  plataformas: 21600,
} as const;

export const RATE_LIMIT_LOGIN = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
} as const;

// Límite general de la API pública: guardia contra scraping/abuso masivo, no
// throttle fino por usuario. Generoso a propósito porque el frontend hace
// fetches server-side (ISR) que salen con la IP del server y se agregan bajo
// una sola IP; con ISR cacheando, ese volumen es bajo y no roza este techo.
export const RATE_LIMIT_API = {
  windowMs: 60 * 1000, // 1 minuto
  max: 300,
} as const;

export const TMDB_MAX_CONCURRENCIA = 4;
