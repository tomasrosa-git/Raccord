import { PosterCard } from './PosterCard';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import type { PeliculaResumen } from '@/types';

/** Tira horizontal tipo contact sheet: divisores finos entre fotogramas. */
export function PeliculasSimilares({ peliculas }: { peliculas: PeliculaResumen[] }) {
  if (peliculas.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Películas afines</EtiquetaSeccion>
      <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-2">
        {peliculas.map((p) => (
          <div key={p.id} className="w-36 shrink-0 bg-negro-sala pr-3 sm:w-44">
            <PosterCard pelicula={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
