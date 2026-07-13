import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPelicula, getSimilares, getPaleta, getPlataformas } from '@/lib/api/peliculas';
import { ApiError } from '@/lib/api/client';
import { Chip } from '@/components/ui/Chip';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { FichaTecnica } from '@/components/pelicula/FichaTecnica';
import { PeliculasSimilares } from '@/components/pelicula/PeliculasSimilares';
import { PlataformasStreaming } from '@/components/pelicula/PlataformasStreaming';
import { AccionesPelicula } from '@/components/pelicula/AccionesPelicula';
import { Reviews } from '@/components/pelicula/Reviews';
import { anioDe, formatearDuracion } from '@/lib/utils/formatters';
import type { PeliculaDetalle } from '@/types';

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

async function buscarPelicula(id: string): Promise<PeliculaDetalle | null> {
  try {
    return await getPelicula(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pelicula = await buscarPelicula(id);
  if (!pelicula) return {};
  return {
    title: `${pelicula.titulo}${anioDe(pelicula.fechaEstreno) ? ` (${anioDe(pelicula.fechaEstreno)})` : ''}`,
    description: pelicula.sinopsis?.slice(0, 160),
  };
}

/** "2.39:1" → 2.39. Si no hay dato se asume 1.85:1 (formato de estreno común). */
function parsearAspectRatio(raw: string | null): { ratio: number; etiqueta: string } {
  if (raw) {
    const [w, h] = raw.split(':').map(Number);
    if (w && h) return { ratio: w / h, etiqueta: raw };
  }
  return { ratio: 1.85, etiqueta: '1.85:1' };
}

function HeroLetterbox({ pelicula }: { pelicula: PeliculaDetalle }) {
  const { ratio, etiqueta } = parsearAspectRatio(pelicula.aspectRatio);
  const anio = anioDe(pelicula.fechaEstreno);

  return (
    <div className="bg-black">
      {/* Barra superior del letterbox: el espacio negro es informativo, no decorativo. */}
      <div aria-hidden className="h-8 sm:h-12" />
      <div className="relative mx-auto max-h-[62vh] max-w-6xl" style={{ aspectRatio: ratio }}>
        {pelicula.backdropUrl ? (
          <Image
            src={pelicula.backdropUrl}
            alt={`Fotograma de ${pelicula.titulo}`}
            fill
            priority
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-carbon font-mono text-sm text-papel/30">
            sin fotograma
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <h1 className="font-display text-3xl leading-tight sm:text-5xl">{pelicula.titulo}</h1>
          <p className="mt-2 font-mono text-xs text-papel/70 sm:text-sm">
            {[anio, formatearDuracion(pelicula.duracionMin), etiqueta]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
        </div>
      </div>
      <div aria-hidden className="h-8 sm:h-12" />
    </div>
  );
}

function PaletaBarra({ colores }: { colores: { colorHex: string; porcentaje: number }[] }) {
  if (colores.length === 0) return null;
  return (
    <section>
      <EtiquetaSeccion>Paleta</EtiquetaSeccion>
      <div className="mt-4 flex h-12 overflow-hidden">
        {colores.map((c) => (
          <div
            key={c.colorHex}
            title={c.colorHex}
            style={{ backgroundColor: c.colorHex, flexGrow: c.porcentaje * 100 }}
            className="basis-0"
          />
        ))}
      </div>
    </section>
  );
}

export default async function PaginaPelicula({ params }: Props) {
  const { id } = await params;
  const pelicula = await buscarPelicula(id);
  if (!pelicula) notFound();

  const [similares, paleta, plataformas] = await Promise.all([
    getSimilares(id).catch(() => []),
    getPaleta(id).catch(() => []),
    getPlataformas(id).catch(() => ({ plataformas: [], link: null })),
  ]);

  return (
    <article>
      <HeroLetterbox pelicula={pelicula} />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-12">
            <AccionesPelicula peliculaId={pelicula.id} />

            <PlataformasStreaming disponibilidad={plataformas} />

            {pelicula.sinopsis && (
              <section>
                <EtiquetaSeccion>Sinopsis</EtiquetaSeccion>
                <p className="mt-4 max-w-2xl leading-relaxed text-papel/80">
                  {pelicula.sinopsis}
                </p>
              </section>
            )}

            {pelicula.cast.length > 0 && (
              <section>
                <EtiquetaSeccion>Elenco</EtiquetaSeccion>
                <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {pelicula.cast.map((actor, i) => (
                    <li key={`${actor.id}-${i}`} className="flex items-baseline justify-between gap-3 border-b border-borde py-2 text-sm">
                      <Link
                        href={`/cineasta/${actor.id}`}
                        className="text-papel/90 underline-offset-4 hover:underline"
                      >
                        {actor.nombre}
                      </Link>
                      {actor.personaje && (
                        <span className="text-right font-mono text-xs text-papel/40">
                          {actor.personaje}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <PaletaBarra colores={paleta} />

            <Reviews peliculaId={pelicula.id} />
          </div>

          <aside className="space-y-8">
            <section>
              <EtiquetaSeccion>Ficha técnica</EtiquetaSeccion>
              <div className="mt-4">
                <FichaTecnica pelicula={pelicula} />
              </div>
            </section>
            {pelicula.generos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pelicula.generos.map((g) => (
                  <Link
                    key={g.id}
                    href={`/explorar?genero=${encodeURIComponent(g.nombre)}`}
                    className="transition-colors hover:text-papel"
                  >
                    <Chip className="hover:border-papel/40">{g.nombre}</Chip>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div className="mt-16">
          <PeliculasSimilares peliculas={similares} />
        </div>
      </div>
    </article>
  );
}
