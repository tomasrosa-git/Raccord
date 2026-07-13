import Link from 'next/link';
import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { DueloTaquilla } from '@/components/juegos/DueloTaquilla';

export const metadata: Metadata = { title: 'Duelo de taquilla' };

export default function PaginaDueloTaquilla() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/juegos"
        className="font-mono text-xs text-papel/40 underline-offset-4 hover:text-papel hover:underline"
      >
        ← Juegos
      </Link>

      <div className="mt-6">
        <EtiquetaSeccion>Duelo de taquilla</EtiquetaSeccion>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">¿Cuál recaudó más?</h1>
        <p className="mt-3 max-w-xl text-sm text-papel/50">
          Dos películas del catálogo. Elegí la que haya hecho más taquilla mundial y
          encadená la racha más larga que puedas. Un error y volvés a cero.
        </p>
      </div>

      <div className="mt-10">
        <DueloTaquilla />
      </div>
    </div>
  );
}
