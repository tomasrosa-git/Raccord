import Link from 'next/link';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Chip } from '@/components/ui/Chip';
import { SalaTrailers } from '@/components/inicio/SalaTrailers';
import { NovedadesTabs } from '@/components/inicio/NovedadesTabs';
import { getStats } from '@/lib/api/stats';
import { getNovedades } from '@/lib/api/novedades';

// Media hora, el mismo pulso que las novedades del backend.
export const revalidate = 1800;

// Los 4 con curaduría en profundidad; el resto se cuenta contra las stats.
const CURADOS = ['Wes Anderson', 'Pedro Almodóvar', 'Lucrecia Martel', 'Bong Joon-ho'];

export default async function Home() {
  const [stats, novedades] = await Promise.all([
    getStats().catch(() => null),
    getNovedades().catch(() => null),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Barra de letterbox superior: guiño al encuadre de proyección. */}
      <div aria-hidden className="h-10 bg-black sm:h-14" />

      <section className="mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-20">
        <EtiquetaSeccion>Cine de autor</EtiquetaSeccion>

        <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
          El cine, del lado de quien lo dirige.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-papel/70 sm:text-lg">
          Filmografías completas, colaboradores de siempre y la paleta de color
          que hace reconocible a cada cineasta. Sin algoritmo de moda: catálogo
          curado, director por director.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/explorar"
            className="rounded-sm bg-marca-cambio px-5 py-2.5 text-sm font-medium text-negro-sala transition-[filter] hover:brightness-110"
          >
            Explorar el catálogo
          </Link>
          {stats && (
            <span className="font-mono text-xs text-papel/40">
              {stats.peliculas} películas · {stats.directores} directores
            </span>
          )}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {CURADOS.map((nombre) => (
            <Chip key={nombre}>{nombre}</Chip>
          ))}
          {stats && stats.directores > CURADOS.length && (
            <Link href="/directores">
              <Chip className="text-papel/40 transition-colors hover:text-papel">
                +{stats.directores - CURADOS.length} más
              </Chip>
            </Link>
          )}
        </div>

        {/* Puente con la sala: sin esto, el corte a negro parece el final de la página. */}
        {novedades && novedades.trailers.length > 0 && (
          <a
            href="#la-sala"
            className="group mt-12 inline-flex items-center gap-3 self-start font-mono text-xs text-papel/50 transition-colors hover:text-marca-cambio"
          >
            <span aria-hidden className="animate-bounce text-marca-cambio">
              ↓
            </span>
            <span>
              Ahora en la sala:{' '}
              <span className="text-papel/80 group-hover:text-marca-cambio">
                el tráiler de {novedades.trailers[0].titulo}
              </span>
            </span>
          </a>
        )}
      </section>

      {/* La sala: el letterbox se vuelve pantalla — tráilers en tiempo real. */}
      {novedades && <SalaTrailers trailers={novedades.trailers} />}

      {novedades && (
        <NovedadesTabs
          cartelera={novedades.cartelera}
          proximos={novedades.proximos}
          tendencias={novedades.tendencias}
        />
      )}

      {/* Barra de letterbox inferior. */}
      <div aria-hidden className="h-10 bg-black sm:h-14" />
    </div>
  );
}
