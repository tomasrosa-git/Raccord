'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getDueloRonda, resolverDuelo } from '@/lib/api/juegos';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { anioDe } from '@/lib/utils/formatters';
import type { DueloPelicula, DueloRonda, DueloResultado } from '@/types';

const CLAVE_RECORD = 'raccord:duelo:record';

function leerRecord(): number {
  try {
    return Number(localStorage.getItem(CLAVE_RECORD)) || 0;
  } catch {
    return 0;
  }
}

function guardarRecord(valor: number) {
  try {
    localStorage.setItem(CLAVE_RECORD, String(valor));
  } catch {
    /* no bloquear el juego si el navegador no deja escribir */
  }
}

/** Una carta del duelo. Tras responder muestra la popularidad real. */
function Carta({
  pelicula,
  onElegir,
  deshabilitado,
  resultado,
  esGanadora,
  fueElegida,
}: {
  pelicula: DueloPelicula;
  onElegir: () => void;
  deshabilitado: boolean;
  resultado: DueloResultado | null;
  esGanadora: boolean;
  fueElegida: boolean;
}) {
  const anio = anioDe(pelicula.fechaEstreno);
  const popularidad = resultado?.popularidad[pelicula.id];

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={deshabilitado}
      className={cn(
        'group relative block w-full overflow-hidden border text-left transition-colors',
        resultado
          ? esGanadora
            ? 'border-marca-cambio'
            : 'border-borde opacity-60'
          : 'border-borde hover:border-papel/40'
      )}
    >
      <div className="relative aspect-2/3 w-full bg-carbon">
        {pelicula.posterUrl && (
          <Image
            src={pelicula.posterUrl}
            alt={`Póster de ${pelicula.titulo}`}
            fill
            sizes="(max-width: 640px) 45vw, 180px"
            className={cn(
              'object-cover transition-opacity',
              !deshabilitado && 'group-hover:opacity-80'
            )}
          />
        )}
        {fueElegida && (
          <span className="absolute left-2 top-2 rounded-sm bg-negro-sala/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-papel/70">
            tu elección
          </span>
        )}
      </div>

      <div className="bg-negro-sala px-3 py-3">
        <p className="line-clamp-2 text-sm leading-snug text-papel/90">{pelicula.titulo}</p>
        <p className="mt-0.5 font-mono text-xs text-papel/40">{anio ?? ''}</p>
        {resultado && popularidad != null && (
          <p
            className={cn(
              'mt-2 font-mono text-sm',
              esGanadora ? 'text-marca-cambio' : 'text-papel/40'
            )}
          >
            {popularidad.toFixed(1)} pts
          </p>
        )}
      </div>
    </button>
  );
}

export function DueloPopularidad() {
  const [ronda, setRonda] = useState<DueloRonda | null>(null);
  const [resultado, setResultado] = useState<DueloResultado | null>(null);
  const [elegidaId, setElegidaId] = useState<string | null>(null);
  const [racha, setRacha] = useState(0);
  const [record, setRecord] = useState(0);
  const [perdido, setPerdido] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const cargarRonda = useCallback(async () => {
    setCargando(true);
    setResultado(null);
    setElegidaId(null);
    try {
      setRonda(await getDueloRonda());
    } catch {
      setError(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    setRecord(leerRecord());
    void cargarRonda();
  }, [cargarRonda]);

  async function elegir(pelicula: DueloPelicula) {
    if (!ronda || resultado || cargando) return;
    setElegidaId(pelicula.id);
    try {
      const res = await resolverDuelo(ronda.a.id, ronda.b.id, pelicula.id);
      setResultado(res);

      if (res.correcto) {
        const nueva = racha + 1;
        setRacha(nueva);
        if (nueva > record) {
          setRecord(nueva);
          guardarRecord(nueva);
        }
      } else {
        setPerdido(true);
      }
    } catch {
      setError(true);
    }
  }

  function reiniciar() {
    setRacha(0);
    setPerdido(false);
    void cargarRonda();
  }

  if (error) {
    return <p className="text-papel/60">No pudimos cargar el duelo. Probá más tarde.</p>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-xs">
        <span className="text-papel/40">
          Racha: <span className="text-papel/90">{racha}</span>
        </span>
        <span className="text-papel/40">
          Récord: <span className="text-marca-cambio">{record}</span>
        </span>
      </div>

      <p className="mt-6 text-center text-sm text-papel/60">
        ¿Cuál es <span className="text-papel">más popular hoy</span>?
      </p>

      {/* Acotado a propósito: dos pósters a tamaño completo se comparan peor
          que dos chicos, lado a lado y abarcables de una mirada. */}
      <div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-4 sm:gap-6">
        {!ronda || cargando ? (
          <>
            <Skeleton className="aspect-2/3 w-full rounded-none" />
            <Skeleton className="aspect-2/3 w-full rounded-none" />
          </>
        ) : (
          [ronda.a, ronda.b].map((p) => (
            <Carta
              key={p.id}
              pelicula={p}
              onElegir={() => elegir(p)}
              deshabilitado={!!resultado}
              resultado={resultado}
              esGanadora={resultado?.ganadoraId === p.id}
              fueElegida={elegidaId === p.id}
            />
          ))
        )}
      </div>

      {resultado && (
        <div className="mt-8 border-t border-borde pt-8">
          <EtiquetaSeccion>{resultado.correcto ? '¡Correcto!' : 'Fallaste'}</EtiquetaSeccion>

          {perdido ? (
            <>
              <p className="mt-4 text-papel/70">
                Terminaste con una racha de <span className="text-papel">{racha}</span>.
                {racha > 0 && racha === record && ' Es tu mejor marca.'}
              </p>
              <button
                type="button"
                onClick={reiniciar}
                className="mt-6 rounded-sm bg-marca-cambio px-5 py-2.5 text-sm font-medium text-negro-sala transition-[filter] hover:brightness-110"
              >
                Jugar de nuevo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void cargarRonda()}
              className="mt-4 rounded-sm bg-marca-cambio px-5 py-2.5 text-sm font-medium text-negro-sala transition-[filter] hover:brightness-110"
            >
              Siguiente duelo →
            </button>
          )}

          <p className="mt-6 font-mono text-xs text-papel/40">
            La popularidad la mide TMDB y cambia con el tiempo.
          </p>
        </div>
      )}

      <p className="mt-10 font-mono text-xs text-papel/30">
        <Link href="/juegos" className="underline-offset-4 hover:text-papel/60 hover:underline">
          ← Volver a juegos
        </Link>
      </p>
    </div>
  );
}
