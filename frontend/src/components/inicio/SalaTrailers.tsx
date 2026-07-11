'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { cn } from '@/lib/utils/cn';
import { anioDe } from '@/lib/utils/formatters';
import type { TrailerNovedad } from '@/types';

/**
 * La sala: los últimos tráilers proyectados dentro del letterbox de la home.
 * La pantalla arranca apagada (solo el fotograma y el botón de play): el
 * iframe de YouTube recién se carga al primer play, para no traer scripts de
 * terceros a quien no va a reproducir nada. Nada se reproduce solo: encender
 * la sala o cambiar de tráiler deja el player de YouTube en pausa.
 */
export function SalaTrailers({ trailers }: { trailers: TrailerNovedad[] }) {
  const [sel, setSel] = useState(0);
  const [encendida, setEncendida] = useState(false);

  if (trailers.length === 0) return null;
  const actual = trailers[sel];

  return (
    <section id="la-sala" className="scroll-mt-4 border-t border-borde bg-black py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <EtiquetaSeccion>La sala</EtiquetaSeccion>
            <h2 className="mt-4 font-display text-2xl text-papel sm:text-3xl">
              Los últimos tráilers
            </h2>
          </div>
          <p className="font-mono text-xs text-papel/40">
            De lo que está en salas o por estrenarse
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Pantalla */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video w-full overflow-hidden bg-negro-sala">
              {encendida ? (
                <iframe
                  key={actual.youtubeKey}
                  src={`https://www.youtube-nocookie.com/embed/${actual.youtubeKey}?rel=0`}
                  title={`Tráiler de ${actual.titulo}`}
                  allow="encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEncendida(true)}
                  aria-label={`Reproducir el tráiler de ${actual.titulo}`}
                  className="group absolute inset-0"
                >
                  {actual.backdropUrl && (
                    <Image
                      src={actual.backdropUrl}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 768px"
                      className="object-cover opacity-70 transition-opacity group-hover:opacity-50"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-marca-cambio text-negro-sala transition-transform group-hover:scale-110">
                      <svg aria-hidden viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg text-papel">{actual.titulo}</p>
              <p className="font-mono text-xs text-papel/40">
                {actual.fechaEstreno && `Estreno ${actual.fechaEstreno.slice(0, 4)} · `}
                {actual.peliculaId && (
                  <Link
                    href={`/pelicula/${actual.peliculaId}`}
                    className="text-marca-cambio underline-offset-4 hover:underline"
                  >
                    Ver ficha →
                  </Link>
                )}
              </p>
            </div>
          </div>

          {/* Programación */}
          <ol className="flex flex-col divide-y divide-borde border-y border-borde">
            {trailers.map((trailer, i) => {
              const activo = i === sel;
              return (
                <li key={trailer.youtubeKey}>
                  <button
                    type="button"
                    onClick={() => setSel(i)}
                    aria-pressed={activo}
                    className={cn(
                      'group flex w-full items-baseline gap-3 px-3 py-3 text-left transition-colors',
                      activo ? 'bg-carbon' : 'hover:bg-carbon/60'
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-xs',
                        activo ? 'text-marca-cambio' : 'text-papel/40'
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span
                        className={cn(
                          'block text-sm leading-snug',
                          activo ? 'text-papel' : 'text-papel/70 group-hover:text-papel'
                        )}
                      >
                        {trailer.titulo}
                      </span>
                      {trailer.fechaEstreno && (
                        <span className="mt-0.5 block font-mono text-xs text-papel/40">
                          {anioDe(trailer.fechaEstreno)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
