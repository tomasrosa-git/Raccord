'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getIntrusoRonda, resolverIntruso } from '@/lib/api/juegos';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import type { IntrusoPelicula, IntrusoRonda, IntrusoResultado } from '@/types';

const CLAVE_RECORD = 'raccord:intruso:record';

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

function Carta({
  pelicula,
  onElegir,
  deshabilitado,
  resultado,
  esIntrusa,
  fueElegida,
}: {
  pelicula: IntrusoPelicula;
  onElegir: () => void;
  deshabilitado: boolean;
  resultado: IntrusoResultado | null;
  esIntrusa: boolean;
  fueElegida: boolean;
}) {
  // Tras responder: la intrusa se resalta en dorado; el resto se atenúa. Si el
  // jugador eligió mal, su carta se marca en rojo.
  const estado = resultado
    ? esIntrusa
      ? 'intrusa'
      : fueElegida
        ? 'erronea'
        : 'grupo'
    : 'jugable';

  return (
    <button
      type="button"
      onClick={onElegir}
      disabled={deshabilitado}
      className={cn(
        'group relative block overflow-hidden border text-left transition-colors',
        estado === 'intrusa' && 'border-marca-cambio',
        estado === 'erronea' && 'border-terciopelo',
        estado === 'grupo' && 'border-borde opacity-50',
        estado === 'jugable' && 'border-borde hover:border-papel/40'
      )}
    >
      <div className="relative aspect-2/3 w-full bg-carbon">
        {pelicula.posterUrl && (
          <Image
            src={pelicula.posterUrl}
            alt={`Póster de ${pelicula.titulo}`}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className={cn('object-cover transition-opacity', !deshabilitado && 'group-hover:opacity-80')}
          />
        )}
        {estado === 'intrusa' && (
          <span className="absolute left-2 top-2 rounded-sm bg-marca-cambio px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-negro-sala">
            la intrusa
          </span>
        )}
        {estado === 'erronea' && (
          <span className="absolute left-2 top-2 rounded-sm bg-terciopelo px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-papel">
            tu elección
          </span>
        )}
      </div>
      <div className="bg-negro-sala px-3 py-2.5">
        <p className="line-clamp-2 text-xs leading-snug text-papel/90 sm:text-sm">{pelicula.titulo}</p>
      </div>
    </button>
  );
}

export function ElIntruso() {
  const [ronda, setRonda] = useState<IntrusoRonda | null>(null);
  const [resultado, setResultado] = useState<IntrusoResultado | null>(null);
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
      setRonda(await getIntrusoRonda());
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

  async function elegir(pelicula: IntrusoPelicula) {
    if (!ronda || resultado || cargando) return;
    setElegidaId(pelicula.id);
    try {
      const res = await resolverIntruso(
        ronda.peliculas.map((p) => p.id),
        ronda.categoria,
        pelicula.id
      );
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
    return <p className="text-papel/60">No pudimos cargar el juego. Probá más tarde.</p>;
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
        Tres de estas cuatro{' '}
        <span className="text-papel">{ronda?.etiqueta ?? '…'}</span>. ¿Cuál es la intrusa?
      </p>

      <div className="mx-auto mt-6 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-3">
        {!ronda || cargando
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-2/3 w-full rounded-none" />
            ))
          : ronda.peliculas.map((p) => (
              <Carta
                key={p.id}
                pelicula={p}
                onElegir={() => elegir(p)}
                deshabilitado={!!resultado}
                resultado={resultado}
                esIntrusa={resultado?.intrusaId === p.id}
                fueElegida={elegidaId === p.id}
              />
            ))}
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
              Siguiente ronda →
            </button>
          )}
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
