export const API_PREFIX = '/api';

export const CACHE_TTL_SEGUNDOS = {
  colaboradores: 3600,
  firmaVisual: 3600,
} as const;

export const RATE_LIMIT_LOGIN = {
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
} as const;

export const TMDB_MAX_CONCURRENCIA = 4;
