import { apiGet } from './client';
import type {
  ListadoPeliculas,
  PeliculaDetalle,
  PeliculaResumen,
  ColorSwatch,
  DecadaPeliculas,
  FacetasPeliculas,
} from '@/types';

// Fichas: ISR de 1 hora. Listados: cache corto de 5 minutos.
const REVALIDATE_FICHA = 3600;
const REVALIDATE_LISTADO = 300;

export type FiltrosPeliculas = {
  genero?: string;
  decada?: number;
  duracion?: string;
  orden?: string;
  pagina?: number;
};

export function getPeliculas(filtros: FiltrosPeliculas = {}) {
  const params = new URLSearchParams();
  if (filtros.genero) params.set('genero', filtros.genero);
  if (filtros.decada) params.set('decada', String(filtros.decada));
  if (filtros.duracion) params.set('duracion', filtros.duracion);
  if (filtros.orden) params.set('orden', filtros.orden);
  if (filtros.pagina) params.set('pagina', String(filtros.pagina));
  const qs = params.size > 0 ? `?${params}` : '';
  return apiGet<ListadoPeliculas>(`/peliculas${qs}`, { revalidate: REVALIDATE_LISTADO });
}

export function getFacetas() {
  return apiGet<FacetasPeliculas>('/peliculas/facetas', { revalidate: REVALIDATE_FICHA });
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

export function getPorDecada() {
  return apiGet<DecadaPeliculas[]>('/peliculas/por-decada', { revalidate: REVALIDATE_FICHA });
}
