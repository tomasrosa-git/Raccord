import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { buscar } from '@/lib/api/busqueda';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';
import type { PersonaBusqueda } from '@/types';

export const metadata: Metadata = { title: 'Buscar' };

type Props = { searchParams: Promise<{ q?: string }> };

function ResultadoPersona({ persona }: { persona: PersonaBusqueda }) {
  return (
    <Link
      href={`/cineasta/${persona.id}`}
      className="group flex items-center gap-3 border-b border-borde py-3"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-carbon">
        {persona.fotoUrl && (
          <Image src={persona.fotoUrl} alt="" fill sizes="48px" className="object-cover" />
        )}
      </div>
      <div>
        <p className="text-sm text-papel/90 group-hover:text-papel">{persona.nombre}</p>
        <p className="font-mono text-xs text-papel/40">
          {persona.esDirector ? 'Dirección' : 'Intérprete'}
        </p>
      </div>
    </Link>
  );
}

export default async function PaginaBuscar({ searchParams }: Props) {
  const { q } = await searchParams;
  const termino = (q ?? '').trim();
  const resultados = termino ? await buscar(termino).catch(() => null) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Búsqueda</EtiquetaSeccion>
      {termino ? (
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">
          Resultados para “{termino}”
        </h1>
      ) : (
        <h1 className="mt-4 font-display text-3xl sm:text-4xl">¿Qué querés ver?</h1>
      )}

      {!termino && (
        <p className="mt-4 text-papel/60">
          Escribí el nombre de una película, un director o un actor en el buscador de arriba.
        </p>
      )}

      {resultados && (
        <div className="mt-10 space-y-12">
          {resultados.personas.length > 0 && (
            <section>
              <EtiquetaSeccion>Cineastas e intérpretes</EtiquetaSeccion>
              <div className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.personas.map((p) => (
                  <ResultadoPersona key={p.id} persona={p} />
                ))}
              </div>
            </section>
          )}

          {resultados.peliculas.length > 0 && (
            <section>
              <EtiquetaSeccion>Películas</EtiquetaSeccion>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {resultados.peliculas.map((p) => (
                  <PosterCard key={p.id} pelicula={p} />
                ))}
              </div>
            </section>
          )}

          {resultados.personas.length === 0 && resultados.peliculas.length === 0 && (
            <p className="text-papel/60">
              No encontramos nada para “{termino}”. Probá con otro nombre.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
