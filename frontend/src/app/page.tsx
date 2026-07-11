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

      <section className="mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
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

        <div className="mt-16 flex flex-wrap gap-2">
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
