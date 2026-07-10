import Link from 'next/link';
import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { ElIntruso } from '@/components/juegos/ElIntruso';

export const metadata: Metadata = { title: 'El intruso' };

export default function PaginaIntruso() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/juegos"
        className="font-mono text-xs text-papel/40 underline-offset-4 hover:text-papel hover:underline"
      >
        ← Juegos
      </Link>

      <div className="mt-6">
        <EtiquetaSeccion>El intruso</EtiquetaSeccion>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">¿Cuál no encaja?</h1>
        <p className="mt-3 max-w-xl text-sm text-papel/50">
          Cada ronda muestra cuatro películas: tres comparten algo —director, protagonista,
          década o género— y una no. Encontrá la intrusa y encadená la racha más larga que
          puedas. Un error y volvés a cero.
        </p>
      </div>

      <div className="mt-10">
        <ElIntruso />
      </div>
    </div>
  );
}
