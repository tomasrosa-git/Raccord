import { apiGet, apiPost } from './client';
import type {
  FrameGuessHoy,
  FrameGuessIntento,
  FrameGuessSolucion,
  DueloRonda,
  DueloResultado,
  DueloTaquillaResultado,
  IntrusoRonda,
  IntrusoResultado,
  CategoriaIntruso,
} from '@/types';

/** El fotograma del día. Sin cache: cambia a medianoche (hora Argentina). */
export function getFrameGuessHoy() {
  return apiGet<FrameGuessHoy>('/juegos/frame-guess/hoy');
}

export function intentarFrameGuess(peliculaId: string) {
  return apiPost<FrameGuessIntento>('/juegos/frame-guess/intentar', { peliculaId });
}

export function getFrameGuessSolucion() {
  return apiPost<FrameGuessSolucion>('/juegos/frame-guess/solucion');
}

/** Duelo de popularidad: la ronda no trae la popularidad — es lo que se adivina. */
export function getDueloRonda() {
  return apiGet<DueloRonda>('/juegos/duelo/ronda', { sinCache: true });
}

export function resolverDuelo(aId: string, bId: string, elegidaId: string) {
  return apiPost<DueloResultado>('/juegos/duelo/resolver', { aId, bId, elegidaId });
}

/** Duelo de taquilla: la ronda no trae la recaudación — es lo que se adivina. */
export function getDueloTaquillaRonda() {
  return apiGet<DueloRonda>('/juegos/duelo-taquilla/ronda', { sinCache: true });
}

export function resolverDueloTaquilla(aId: string, bId: string, elegidaId: string) {
  return apiPost<DueloTaquillaResultado>('/juegos/duelo-taquilla/resolver', { aId, bId, elegidaId });
}

/** El Intruso: la ronda no dice cuál es la intrusa — se valida en el server. */
export function getIntrusoRonda() {
  return apiGet<IntrusoRonda>('/juegos/intruso/ronda', { sinCache: true });
}

export function resolverIntruso(ids: string[], categoria: CategoriaIntruso, elegidaId: string) {
  return apiPost<IntrusoResultado>('/juegos/intruso/resolver', { ids, categoria, elegidaId });
}
