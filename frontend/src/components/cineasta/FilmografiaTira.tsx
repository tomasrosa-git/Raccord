import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';
import type { CreditoFilmografia } from '@/types';

/**
 * Filmografía como tira de contact sheet: miniaturas en fila horizontal con
 * divisores finos, simulando el corte entre fotogramas de un negativo.
 * `mostrarPersonaje` agrega el nombre del personaje bajo cada póster (actor).
 */
export function FilmografiaTira({
  titulo,
  creditos,
  mostrarPersonaje = false,
}: {
  titulo: string;
  creditos: CreditoFilmografia[];
  mostrarPersonaje?: boolean;
}) {
  if (creditos.length === 0) return null;

  return (
    <section>
      <EtiquetaSeccion>{titulo}</EtiquetaSeccion>
      <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-2">
        {creditos.map((credito, i) => (
          <div
            key={`${credito.pelicula.id}-${i}`}
            className="w-36 shrink-0 bg-negro-sala pr-3 sm:w-44"
          >
            <PosterCard pelicula={credito.pelicula} />
            {mostrarPersonaje && credito.personaje && (
              <p className="mt-0.5 line-clamp-1 font-mono text-xs text-papel/40">
                {credito.personaje}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
