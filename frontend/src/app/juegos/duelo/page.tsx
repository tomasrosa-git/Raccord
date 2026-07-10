import Link from 'next/link';
import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { DueloPopularidad } from '@/components/juegos/DueloPopularidad';

export const metadata: Metadata = { title: 'Duelo de popularidad' };

export default function PaginaDuelo() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/juegos"
        className="font-mono text-xs text-papel/40 underline-offset-4 hover:text-papel hover:underline"
      >
        ← Juegos
      </Link>

      <div className="mt-6">
        <EtiquetaSeccion>Duelo de popularidad</EtiquetaSeccion>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">¿Cuál pesa más hoy?</h1>
        <p className="mt-3 max-w-xl text-sm text-papel/50">
          Dos películas del catálogo. Elegí la que tenga más popularidad actual en TMDB
          y encadená la racha más larga que puedas. Un error y volvés a cero.
        </p>
      </div>

      <div className="mt-10">
        <DueloPopularidad />
      </div>
    </div>
  );
}
