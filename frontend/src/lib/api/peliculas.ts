import { apiGet } from './client';
import type { ListadoPeliculas, PeliculaDetalle, PeliculaResumen, ColorSwatch } from '@/types';

// Fichas: ISR de 1 hora. Listados: cache corto de 5 minutos.
const REVALIDATE_FICHA = 3600;
const REVALIDATE_LISTADO = 300;

export function getPeliculas(filtros: { genero?: string; anio?: number; pagina?: number } = {}) {
  const params = new URLSearchParams();
  if (filtros.genero) params.set('genero', filtros.genero);
  if (filtros.anio) params.set('anio', String(filtros.anio));
  if (filtros.pagina) params.set('pagina', String(filtros.pagina));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiGet<ListadoPeliculas>(`/peliculas${qs}`, { revalidate: REVALIDATE_LISTADO });
}

export function getPelicula(id: string) {
  return apiGet<PeliculaDetalle>(`/peliculas/${id}`, { revalidate: REVALIDATE_FICHA });
}

export function getSimilares(id: string) {
  return apiGet<PeliculaResumen[]>(`/peliculas/${id}/similares`, { revalidate: REVALIDATE_FICHA });
}

export function getPaleta(id: string) {
  return apiGet<ColorSwatch[]>(`/peliculas/${id}/paleta`, { revalidate: REVALIDATE_FICHA });
}
