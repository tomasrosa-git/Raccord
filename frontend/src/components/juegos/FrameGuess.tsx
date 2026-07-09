'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { buscar } from '@/lib/api/busqueda';
import { getFrameGuessHoy, intentarFrameGuess, getFrameGuessSolucion } from '@/lib/api/juegos';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { anioDe } from '@/lib/utils/formatters';
import type { FrameGuessHoy, FrameGuessSolucion, PeliculaBusqueda } from '@/types';

// Un nivel de desenfoque por intento disponible: se afina con cada fallo.
// El último todavía tiene algo de blur — si no, el 5º intento sería regalado.
const DESENFOQUES = [24, 16, 10, 6, 3];

type Estado = 'jugando' | 'ganado' | 'perdido';

interface Guardado {
  estado: Exclude<Estado, 'jugando'>;
  /** Intentos fallados. El total incluye, además, el acierto si ganó. */
  fallos: number;
  solucion: FrameGuessSolucion;
}

const claveDe = (fecha: string) => `raccord:frame-guess:${fecha}`;

function leerGuardado(fecha: string): Guardado | null {
  try {
    const crudo = localStorage.getItem(claveDe(fecha));
    return crudo ? (JSON.parse(crudo) as Guardado) : null;
  } catch {
    return null; // localStorage bloqueado o dato corrupto: se juega igual.
  }
}

function guardar(fecha: string, valor: Guardado) {
  try {
    localStorage.setItem(claveDe(fecha), JSON.stringify(valor));
  } catch {
    /* no bloquear el juego si el navegador no deja escribir */
  }
}

export function FrameGuess() {
  const [hoy, setHoy] = useState<FrameGuessHoy | null>(null);
  const [error, setError] = useState(false);

  const [estado, setEstado] = useState<Estado>('jugando');
  const [fallidos, setFallidos] = useState<string[]>([]);
  const [solucion, setSolucion] = useState<FrameGuessSolucion | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [consulta, setConsulta] = useState('');
  const [sugerencias, setSugerencias] = useState<PeliculaBusqueda[]>([]);

  // Carga el fotograma del día y restaura la partida si ya se jugó hoy.
  useEffect(() => {
    let vigente = true;
    getFrameGuessHoy()
      .then((datos) => {
        if (!vigente) return;
        setHoy(datos);
        const previo = leerGuardado(datos.fecha);
        if (previo) {
          setEstado(previo.estado);
          setSolucion(previo.solucion);
          // Los títulos fallados no se guardan: solo cuántos fueron, para el marcador.
          setFallidos(new Array(Math.max(0, previo.fallos ?? 0)).fill(''));
        }
      })
      .catch(() => vigente && setError(true));
    return () => {
      vigente = false;
    };
  }, []);

  // Autocompletado contra el catálogo, con debounce para no pegarle a la API
  // en cada tecla.
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (estado !== 'jugando') return;
    const termino = consulta.trim();
    if (termino.length < 2) {
      setSugerencias([]);
      return;
    }
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      buscar(termino)
        .then((r) => setSugerencias(r.peliculas.slice(0, 6)))
        .catch(() => setSugerencias([]));
    }, 250);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [consulta, estado]);

  const fallos = fallidos.length;
  // El intento ganador cuenta: acertar de una son 1 intento y 0 fallos.
  const intentosTotales = fallos + (estado === 'ganado' ? 1 : 0);
  const desenfoque = useMemo(() => {
    if (estado !== 'jugando') return 0;
    return DESENFOQUES[Math.min(fallos, DESENFOQUES.length - 1)]!;
  }, [estado, fallos]);

  async function adivinar(pelicula: PeliculaBusqueda) {
    if (!hoy || estado !== 'jugando' || enviando) return;
    setEnviando(true);
    setConsulta('');
    setSugerencias([]);

    try {
      const { correcto, solucion: sol } = await intentarFrameGuess(pelicula.id);

      if (correcto && sol) {
        setEstado('ganado');
        setSolucion(sol);
        guardar(hoy.fecha, { estado: 'ganado', fallos: fallidos.length, solucion: sol });
        return;
      }

      const nuevosFallidos = [...fallidos, pelicula.titulo];
      setFallidos(nuevosFallidos);

      if (nuevosFallidos.length >= hoy.maxIntentos) {
        const revelada = await getFrameGuessSolucion();
        setEstado('perdido');
        setSolucion(revelada);
        guardar(hoy.fecha, {
          estado: 'perdido',
          fallos: nuevosFallidos.length,
          solucion: revelada,
        });
      }
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  if (error) {
    return <p className="text-papel/60">No pudimos cargar el juego de hoy. Probá más tarde.</p>;
  }

  if (!hoy) {
    return (
      <div>
        <Skeleton className="aspect-video w-full rounded-none" />
        <Skeleton className="mt-6 h-10 w-full max-w-md" />
      </div>
    );
  }

  const terminado = estado !== 'jugando';
  const restantes = hoy.maxIntentos - fallos;

  return (
    <div>
      {/* Fotograma: el desenfoque se afina con cada fallo. */}
      <div className="relative aspect-video w-full overflow-hidden bg-carbon">
        <Image
          src={hoy.backdropUrl}
          alt={terminado ? (solucion?.titulo ?? 'Fotograma') : 'Fotograma a adivinar'}
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-cover transition-[filter] duration-700"
          style={{ filter: `blur(${desenfoque}px)`, transform: 'scale(1.06)' }}
        />
      </div>

      {/* Marcador de intentos */}
      <div className="mt-5 flex items-center gap-2">
        {Array.from({ length: hoy.maxIntentos }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              'h-1.5 w-8 rounded-full',
              i < fallos
                ? 'bg-terciopelo'
                : estado === 'ganado' && i === fallos
                  ? 'bg-marca-cambio'
                  : 'bg-borde'
            )}
          />
        ))}
        <span className="ml-2 font-mono text-xs text-papel/40">
          {terminado
            ? `${intentosTotales} ${intentosTotales === 1 ? 'intento' : 'intentos'}`
            : `${restantes} ${restantes === 1 ? 'intento' : 'intentos'}`}
        </span>
      </div>

      {!terminado && (
        <div className="relative mt-6 max-w-md">
          <label htmlFor="fg-input" className="sr-only">
            Adivinar la película
          </label>
          <input
            id="fg-input"
            type="search"
            autoComplete="off"
            value={consulta}
            disabled={enviando}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="Escribí el título de la película…"
            className="w-full rounded-sm border border-borde bg-carbon px-3 py-2.5 text-sm text-papel placeholder:text-papel/40 focus:border-papel/40 focus:outline-none disabled:opacity-50"
          />

          {sugerencias.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm border border-borde bg-carbon">
              {sugerencias.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => adivinar(p)}
                    className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm text-papel/90 hover:bg-negro-sala hover:text-papel"
                  >
                    <span>{p.titulo}</span>
                    {anioDe(p.fechaEstreno) && (
                      <span className="font-mono text-xs text-papel/40">
                        {anioDe(p.fechaEstreno)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Intentos fallidos de esta partida (los restaurados no guardan el título). */}
      {fallidos.some(Boolean) && (
        <ul className="mt-5 space-y-1">
          {fallidos.filter(Boolean).map((titulo, i) => (
            <li key={i} className="font-mono text-xs text-papel/40 line-through">
              {titulo}
            </li>
          ))}
        </ul>
      )}

      {terminado && solucion && (
        <div className="mt-8 border-t border-borde pt-8">
          <EtiquetaSeccion>
            {estado === 'ganado' ? '¡Correcto!' : 'Se acabaron los intentos'}
          </EtiquetaSeccion>
          <Link
            href={`/pelicula/${solucion.id}`}
            className="group mt-5 flex items-center gap-4 border border-borde bg-carbon p-3 pr-5"
          >
            <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-negro-sala">
              {solucion.posterUrl && (
                <Image
                  src={solucion.posterUrl}
                  alt={`Póster de ${solucion.titulo}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p className="font-display text-xl text-papel">{solucion.titulo}</p>
              <p className="mt-0.5 font-mono text-xs text-papel/40">
                {anioDe(solucion.fechaEstreno) ?? ''}
              </p>
              <p className="mt-2 font-mono text-xs text-marca-cambio underline-offset-4 group-hover:underline">
                Ver ficha →
              </p>
            </div>
          </Link>
          <p className="mt-6 font-mono text-xs text-papel/40">
            Mañana hay un fotograma nuevo.
          </p>
        </div>
      )}
    </div>
  );
}
