'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { cn } from '@/lib/utils/cn';
import type { FirmaVisualItem } from '@/types';

/**
 * Firma visual del director: timeline horizontal de swatches de color,
 * una columna por película en orden cronológico (datos de ColorPaleta).
 * Tocar una columna selecciona ese año y abre debajo las películas que el
 * director hizo ese año (en mobile no hay hover: sin esto no habría forma
 * de saber qué película es cada columna sin salir de la página).
 */
export function FirmaVisual({ items }: { items: FirmaVisualItem[] }) {
  const [anioSel, setAnioSel] = useState<number | null>(null);

  if (items.length === 0) return null;

  const seleccionadas = anioSel === null ? [] : items.filter((i) => i.anio === anioSel);

  return (
    <section>
      <EtiquetaSeccion>Firma visual</EtiquetaSeccion>
      <p className="mt-2 text-sm text-papel/50">
        Los colores dominantes de cada película, en orden cronológico. Tocá un año para ver la película.
      </p>
      <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-3">
        {items.map((item) => {
          const activa = anioSel !== null && item.anio === anioSel;
          return (
            <button
              key={item.peliculaId}
              type="button"
              onClick={() => setAnioSel(activa ? null : item.anio)}
              title={item.titulo}
              aria-pressed={activa}
              className={cn(
                'group w-16 shrink-0 bg-negro-sala pr-px sm:w-20',
                anioSel !== null && !activa && 'opacity-50'
              )}
            >
              <div className="flex h-40 flex-col sm:h-48">
                {item.colores.map((c, i) => (
                  <div
                    key={`${c.colorHex}-${i}`}
                    // ×100: si la suma de flex-grow queda < 1, flexbox no reparte todo el alto.
                    style={{ backgroundColor: c.colorHex, flexGrow: c.porcentaje * 100 }}
                    className="min-h-2 basis-0 transition-opacity group-hover:opacity-90"
                  />
                ))}
              </div>
              <p
                className={cn(
                  'mt-2 text-center font-mono text-[10px]',
                  activa ? 'text-marca-cambio' : 'text-papel/40 group-hover:text-papel/70'
                )}
              >
                {item.anio ?? '—'}
              </p>
            </button>
          );
        })}
      </div>

      {seleccionadas.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {seleccionadas.map((p) => (
            <Link
              key={p.peliculaId}
              href={`/pelicula/${p.peliculaId}`}
              className="group flex items-center gap-4 border border-borde bg-carbon p-3 pr-5"
            >
              <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-negro-sala">
                {p.posterUrl ? (
                  <Image
                    src={p.posterUrl}
                    alt={`Póster de ${p.titulo}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-1 text-center font-mono text-[9px] text-papel/30">
                    {p.titulo}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-papel/90 group-hover:text-papel">{p.titulo}</p>
                <p className="mt-0.5 font-mono text-xs text-papel/40">{p.anio ?? ''}</p>
                <p className="mt-1.5 font-mono text-xs text-marca-cambio underline-offset-4 group-hover:underline">
                  Ver ficha →
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
