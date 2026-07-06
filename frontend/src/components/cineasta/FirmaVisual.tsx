import Link from 'next/link';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import type { FirmaVisualItem } from '@/types';

/**
 * Firma visual del director: timeline horizontal de swatches de color,
 * una columna por película en orden cronológico (datos de ColorPaleta).
 */
export function FirmaVisual({ items }: { items: FirmaVisualItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Firma visual</EtiquetaSeccion>
      <p className="mt-2 text-sm text-papel/50">
        Los colores dominantes de cada película, en orden cronológico.
      </p>
      <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-3">
        {items.map((item) => (
          <Link
            key={item.peliculaId}
            href={`/pelicula/${item.peliculaId}`}
            title={item.titulo}
            className="group w-16 shrink-0 bg-negro-sala pr-px sm:w-20"
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
            <p className="mt-2 text-center font-mono text-[10px] text-papel/40 group-hover:text-papel/70">
              {item.anio ?? '—'}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
