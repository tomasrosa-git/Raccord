import { apiGet, apiPost } from './client';
import type { FrameGuessHoy, FrameGuessIntento, FrameGuessSolucion } from '@/types';

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
