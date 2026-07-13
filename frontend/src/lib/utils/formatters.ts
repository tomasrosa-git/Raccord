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

/**
 * Formatea un monto en dólares de forma compacta para la ficha y los juegos.
 * Todo se expresa en millones ("US$ 2.923 M" = 2923 millones), salvo los
 * presupuestos chicos que no llegan al millón. Devuelve null si no hay dato.
 */
export function formatearDinero(usd: number | null): string | null {
  if (usd == null || usd <= 0) return null;
  const millones = Math.round(usd / 1_000_000);
  if (millones >= 1) return `US$ ${millones.toLocaleString('es-AR')} M`;
  return `US$ ${Math.round(usd / 1_000).toLocaleString('es-AR')} mil`;
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
