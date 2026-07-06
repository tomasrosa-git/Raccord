import Link from 'next/link';
import Image from 'next/image';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { NOMBRE_ROL } from '@/lib/utils/formatters';
import type { Colaborador, RolCredito } from '@/types';

export function ColaboradoresFrecuentes({ colaboradores }: { colaboradores: Colaborador[] }) {
  if (colaboradores.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Colaboradores frecuentes</EtiquetaSeccion>
      <ul className="mt-6 grid gap-x-8 sm:grid-cols-2">
        {colaboradores.slice(0, 10).map((c) => (
          <li key={c.id} className="border-b border-borde">
            <Link
              href={`/cineasta/${c.id}`}
              className="group flex items-center gap-4 py-3"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-carbon">
                {c.fotoUrl && (
                  <Image
                    src={c.fotoUrl}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-papel/90 group-hover:text-papel">
                  {c.nombre}
                </p>
                <p className="truncate font-mono text-xs text-papel/40">
                  {Object.entries(c.porRol)
                    .map(([rol, n]) => `${NOMBRE_ROL[rol as RolCredito]} ×${n}`)
                    .join(' · ')}
                </p>
              </div>
              <span className="font-mono text-sm text-marca-cambio">{c.colaboraciones}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
