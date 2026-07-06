import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { MarcaCambio } from '@/components/ui/MarcaCambio';
import type { EtapaCarrera } from '@/types';

/** Etapas de carrera escritas a mano (solo directores curados). */
export function LineaDeTiempo({ etapas }: { etapas: EtapaCarrera[] }) {
  if (etapas.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Etapas</EtiquetaSeccion>
      <ol className="mt-6 space-y-8 border-l border-borde pl-6">
        {etapas.map((etapa) => (
          <li key={etapa.id} className="relative">
            <MarcaCambio className="absolute -left-[29px] top-1.5" tamanio={7} />
            <p className="font-mono text-xs text-papel/40">
              {etapa.anioInicio}–{etapa.anioFin ?? 'hoy'}
            </p>
            <h3 className="mt-1 font-display text-xl">{etapa.titulo}</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-papel/70">
              {etapa.descripcion}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
