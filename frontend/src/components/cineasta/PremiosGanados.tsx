import Link from 'next/link';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import type { PremioGanado } from '@/types';

export function PremiosGanados({ premios }: { premios: PremioGanado[] }) {
  if (premios.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Premios</EtiquetaSeccion>
      <ul className="mt-6 space-y-1">
        {premios.map((p, i) => (
          <li
            key={i}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-borde py-2.5 text-sm"
          >
            <span className="font-mono text-xs text-papel/40">{p.anio}</span>
            <span className={p.ganador ? 'text-papel' : 'text-papel/60'}>
              {p.premio.nombre} — {p.premio.categoria}
            </span>
            {p.ganador && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-marca-cambio">
                ganador
              </span>
            )}
            {p.pelicula && (
              <Link
                href={`/pelicula/${p.pelicula.id}`}
                className="text-papel/50 underline-offset-4 hover:underline"
              >
                {p.pelicula.titulo}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
