import { apiGet } from './client';
import type { ResultadoBusqueda } from '@/types';

export function buscar(q: string) {
  // Sin cache: cada término es único y los resultados deben ser frescos.
  return apiGet<ResultadoBusqueda>(`/buscar?q=${encodeURIComponent(q)}`);
}
