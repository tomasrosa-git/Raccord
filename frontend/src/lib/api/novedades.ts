import { apiGet } from './client';
import type { Novedades } from '@/types';

/** Novedades del cine para la home. El backend cachea 30 min; acá igual. */
export function getNovedades() {
  return apiGet<Novedades>('/novedades', { revalidate: 1800 });
}
