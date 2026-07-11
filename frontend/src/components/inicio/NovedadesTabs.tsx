'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { cn } from '@/lib/utils/cn';
import { anioDe } from '@/lib/utils/formatters';
import type { NovedadPelicula } from '@/types';

type Pestania = 'cartelera' | 'proximos' | 'tendencias';

const PESTANIAS: { clave: Pestania; etiqueta: string }[] = [
  { clave: 'cartelera', etiqueta: 'En cartelera' },
  { clave: 'proximos', etiqueta: 'Próximos estrenos' },
  { clave: 'tendencias', etiqueta: 'Tendencias de la semana' },
];

function fechaCorta(fecha: string): string {
  return new Date(`${fecha}T00:00:00Z`).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function diasHasta(fecha: string): number {
  return Math.ceil((Date.parse(`${fecha}T00:00:00Z`) - Date.now()) / 86_400_000);
}

/**
 * Novedades del cine en tres pestañas: cartelera argentina, calendario de
 * próximos estrenos y tendencias de la semana (datos de TMDB, refrescados
 * cada media hora). Si la película está en el catálogo la tarjeta va a su
 * ficha; si no, sale a TMDB (marcada con ↗).
 */
export function NovedadesTabs({
  cartelera,
  proximos,
  tendencias,
}: Record<Pestania, NovedadPelicula[]>) {
  const listas: Record<Pestania, NovedadPelicula[]> = { cartelera, proximos, tendencias };
  const disponibles = PESTANIAS.filter((p) => listas[p.clave].length > 0);
  const [activa, setActiva] = useState<Pestania>(disponibles[0]?.clave ?? 'cartelera');

  if (disponibles.length === 0) return null;
  const peliculas = listas[activa];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <EtiquetaSeccion>Novedades</EtiquetaSeccion>

      <div
        role="tablist"
        aria-label="Novedades del cine"
        className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-borde"
      >
        {disponibles.map(({ clave, etiqueta }) => (
          <button
            key={clave}
            role="tab"
            aria-selected={activa === clave}
            onClick={() => setActiva(clave)}
            className={cn(
              '-mb-px border-b pb-3 font-mono text-xs uppercase tracking-[0.15em] transition-colors',
              activa === clave
                ? 'border-marca-cambio text-marca-cambio'
                : 'border-transparent text-papel/50 hover:text-papel'
            )}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3">
        {peliculas.map((pelicula) => {
          const externa = pelicula.peliculaId === null;
          const href = externa
            ? `https://www.themoviedb.org/movie/${pelicula.tmdbId}`
            : `/pelicula/${pelicula.peliculaId}`;
          const dias = activa === 'proximos' && pelicula.fechaEstreno
            ? diasHasta(pelicula.fechaEstreno)
            : null;

          return (
            <Link
              key={pelicula.tmdbId}
              href={href}
              {...(externa && { target: '_blank', rel: 'noopener noreferrer' })}
              className="group block w-36 shrink-0 snap-start sm:w-44"
            >
              <div className="relative aspect-2/3 overflow-hidden bg-carbon">
                {pelicula.posterUrl ? (
                  <Image
                    src={pelicula.posterUrl}
                    alt={`Póster de ${pelicula.titulo}`}
                    fill
                    sizes="(max-width: 640px) 40vw, 180px"
                    className="object-cover transition-opacity group-hover:opacity-80"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center font-mono text-xs text-papel/30">
                    {pelicula.titulo}
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-snug text-papel/90 group-hover:text-papel">
                {pelicula.titulo}
                {externa && <span className="text-papel/40"> ↗</span>}
              </p>
              <p className="mt-0.5 flex items-center gap-2 font-mono text-xs text-papel/40">
                {dias !== null && pelicula.fechaEstreno ? (
                  <>
                    <span>{fechaCorta(pelicula.fechaEstreno)}</span>
                    {/* Depende de "hoy": puede diferir por horas entre server y cliente. */}
                    <span suppressHydrationWarning className="text-marca-cambio/80">
                      {dias === 1 ? 'mañana' : `en ${dias} días`}
                    </span>
                  </>
                ) : (
                  <>
                    {anioDe(pelicula.fechaEstreno) && <span>{anioDe(pelicula.fechaEstreno)}</span>}
                    {pelicula.votoPromedio != null && (
                      <span className="text-marca-cambio/80">
                        ★ {pelicula.votoPromedio.toFixed(1)}
                      </span>
                    )}
                  </>
                )}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
