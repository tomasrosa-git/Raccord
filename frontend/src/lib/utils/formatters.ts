import type { RolCredito } from '@/types';

export function anioDe(fecha: string | null): string | null {
  return fecha ? fecha.slice(0, 4) : null;
}

export function formatearDuracion(minutos: number | null): string | null {
  if (!minutos) return null;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

export function formatearFecha(fecha: string | null): string | null {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const NOMBRE_ROL: Record<RolCredito, string> = {
  DIRECTOR: 'Dirección',
  GUIONISTA: 'Guion',
  FOTOGRAFIA: 'Fotografía',
  MONTAJE: 'Montaje',
  MUSICA: 'Música',
  PRODUCTOR: 'Producción',
  ACTOR: 'Actuación',
};
