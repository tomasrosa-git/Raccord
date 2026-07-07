import { apiGet } from './client';
import type {
  PersonaDetalle,
  CreditoFilmografia,
  Colaborador,
  FirmaVisualItem,
  PremioGanado,
  EtapaCarrera,
  DirectorResumen,
} from '@/types';

const REVALIDATE_PERFIL = 3600;
const REVALIDATE_LISTADO = 600;

export function getDirectores() {
  return apiGet<DirectorResumen[]>('/personas/directores', { revalidate: REVALIDATE_LISTADO });
}

export function getPersona(id: string) {
  return apiGet<PersonaDetalle>(`/personas/${id}`, { revalidate: REVALIDATE_PERFIL });
}

export function getFilmografia(id: string, rol?: string) {
  const qs = rol ? `?rol=${rol}` : '';
  return apiGet<CreditoFilmografia[]>(`/personas/${id}/filmografia${qs}`, {
    revalidate: REVALIDATE_PERFIL,
  });
}

export function getColaboradores(id: string) {
  return apiGet<Colaborador[]>(`/personas/${id}/colaboradores`, { revalidate: REVALIDATE_PERFIL });
}

export function getFirmaVisual(id: string) {
  return apiGet<FirmaVisualItem[]>(`/personas/${id}/firma-visual`, {
    revalidate: REVALIDATE_PERFIL,
  });
}

export function getPremios(id: string) {
  return apiGet<PremioGanado[]>(`/personas/${id}/premios`, { revalidate: REVALIDATE_PERFIL });
}

export function getEtapasCarrera(id: string) {
  return apiGet<EtapaCarrera[]>(`/personas/${id}/etapas-carrera`, {
    revalidate: REVALIDATE_PERFIL,
  });
}
