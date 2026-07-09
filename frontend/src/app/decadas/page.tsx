import type { Metadata } from 'next';
import { getPorDecada } from '@/lib/api/peliculas';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';

export const metadata: Metadata = { title: 'Décadas' };
export const revalidate = 3600;

/** 1970 → "Los 70"; 2000 en adelante → "Los 2000". */
function nombreDecada(decada: number) {
  return decada < 2000 ? `Los ${decada % 100}` : `Los ${decada}`;
}

export default async function PaginaDecadas() {
  const decadas = await getPorDecada().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Décadas</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">
        Lo más importante, década a década
      </h1>
      <p className="mt-3 max-w-xl text-sm text-papel/50">
        Las películas del catálogo que más resuenan hoy, según su popularidad
        actual en TMDB. Un recorrido por la historia del cine de autor.
      </p>

      {decadas.length === 0 ? (
        <p className="mt-12 text-papel/60">Todavía no hay datos de popularidad.</p>
      ) : (
        <div className="mt-14 space-y-16">
          {decadas.map(({ decada, peliculas }, indiceDecada) => (
            <section key={decada}>
              <div className="flex items-baseline gap-4">
                <h2 className="font-display text-2xl sm:text-3xl">{nombreDecada(decada)}</h2>
                <span className="font-mono text-xs text-papel/40">
                  {decada}—{decada + 9}
                </span>
              </div>
              {/* Tira tipo contact sheet, como la filmografía de los perfiles. */}
              <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-2">
                {peliculas.map((p, i) => (
                  <div key={p.id} className="w-36 shrink-0 bg-negro-sala pr-3 sm:w-44">
                    {/* Solo la primera tira entra sin scrollear. */}
                    <PosterCard pelicula={p} prioridad={indiceDecada === 0 && i < 4} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
