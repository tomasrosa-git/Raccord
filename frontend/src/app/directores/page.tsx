import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getDirectores } from '@/lib/api/personas';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';

export const metadata: Metadata = { title: 'Directores' };
export const revalidate = 600;

export default async function PaginaDirectores() {
  const directores = await getDirectores().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Directores</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Los cineastas del catálogo</h1>
      <p className="mt-3 font-mono text-xs text-papel/40">{directores.length} directores</p>

      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {directores.map((d) => (
          <Link key={d.id} href={`/cineasta/${d.id}`} className="group text-center">
            <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-full bg-carbon">
              {d.fotoUrl ? (
                <Image
                  src={d.fotoUrl}
                  alt={d.nombre}
                  fill
                  sizes="160px"
                  className="object-cover transition-opacity group-hover:opacity-80"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-3 text-center font-mono text-xs text-papel/30">
                  {d.nombre}
                </div>
              )}
            </div>
            <p className="mt-3 text-sm text-papel/90 group-hover:text-papel">{d.nombre}</p>
            <p className="font-mono text-xs text-papel/40">
              {d.peliculasDirigidas} película{d.peliculasDirigidas === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
