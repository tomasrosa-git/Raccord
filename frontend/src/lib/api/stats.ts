import { apiGet } from './client';

export interface StatsCatalogo {
  peliculas: number;
  directores: number;
}

export function getStats() {
  return apiGet<StatsCatalogo>('/stats', { revalidate: 3600 });
}
