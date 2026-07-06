import Link from 'next/link';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <EtiquetaSeccion>Corte de rollo</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-4xl sm:text-5xl">
        Esta página no está en el catálogo.
      </h1>
      <p className="mt-4 text-papel/60">
        Puede que el link esté roto o que la hayamos sacado de cartel.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="font-mono text-sm text-marca-cambio underline-offset-4 hover:underline"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
