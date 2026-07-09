import Link from 'next/link';
import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { FrameGuess } from '@/components/juegos/FrameGuess';

export const metadata: Metadata = { title: 'Frame Guess' };

export default function PaginaFrameGuess() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/juegos"
        className="font-mono text-xs text-papel/40 underline-offset-4 hover:text-papel hover:underline"
      >
        ← Juegos
      </Link>

      <div className="mt-6">
        <EtiquetaSeccion>Frame Guess</EtiquetaSeccion>
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">¿De qué película es este plano?</h1>
        <p className="mt-3 max-w-xl text-sm text-papel/50">
          Tenés cinco intentos. Con cada fallo, el fotograma se revela un poco más.
        </p>
      </div>

      <div className="mt-10">
        <FrameGuess />
      </div>
    </div>
  );
}
