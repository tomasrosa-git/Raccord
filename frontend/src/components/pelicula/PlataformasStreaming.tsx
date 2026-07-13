import Image from 'next/image';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import type { DisponibilidadStreaming } from '@/types';

/**
 * "Dónde verla": las plataformas de streaming de Argentina donde está
 * disponible la película (suscripción o gratis). Cada chip enlaza al detalle
 * de JustWatch/TMDB. Si no hay ninguna, la sección no se muestra.
 */
export function PlataformasStreaming({
  disponibilidad,
}: {
  disponibilidad: DisponibilidadStreaming;
}) {
  const { plataformas, link } = disponibilidad;
  if (plataformas.length === 0) return null;

  return (
    <section>
      <EtiquetaSeccion>Dónde verla</EtiquetaSeccion>
      <ul className="mt-4 flex flex-wrap gap-3">
        {plataformas.map((p) => {
          const contenido = (
            <>
              {p.logoUrl && (
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md">
                  <Image src={p.logoUrl} alt="" fill sizes="36px" className="object-cover" />
                </span>
              )}
              <span className="text-sm text-papel/90">{p.nombre}</span>
              {link && (
                <span
                  aria-hidden
                  className="font-mono text-xs text-papel/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-marca-cambio"
                >
                  ↗
                </span>
              )}
            </>
          );
          const clases =
            'group flex items-center gap-2.5 rounded-md border border-borde bg-negro-sala py-1.5 pl-1.5 pr-3 transition-all hover:-translate-y-0.5 hover:border-papel/40';

          return (
            <li key={p.id}>
              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clases}
                  title={`Ver dónde mirar ${p.nombre} en Argentina`}
                >
                  {contenido}
                </a>
              ) : (
                <div className={clases}>{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 font-mono text-xs text-papel/30">
        Disponibilidad en Argentina · datos de JustWatch
      </p>
    </section>
  );
}
