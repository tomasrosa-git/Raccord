import { apiGet } from './client';
import type { PerfilPublico } from '@/types';

/** Perfil público de un usuario por username (panteón + actividad). */
export function getPerfilPublico(username: string) {
  return apiGet<PerfilPublico>(`/usuarios/${encodeURIComponent(username)}/perfil`, {
    revalidate: 60,
  });
}
