'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '@/lib/utils/cn';

// La puntuación se guarda en medias estrellas: 1..10 (1 = ½★, 10 = 5★).
export const MAX_PUNTUACION = 10;

/** Muestra una puntuación 1..10 como 5 estrellas, con medias. Solo lectura. */
export function EstrellasDisplay({
  puntuacion,
  className,
}: {
  puntuacion: number;
  className?: string;
}) {
  const pct = (Math.max(0, Math.min(MAX_PUNTUACION, puntuacion)) / MAX_PUNTUACION) * 100;
  return (
    <span
      className={cn('relative inline-block font-mono leading-none', className)}
      aria-label={`${puntuacion / 2} de 5`}
    >
      {/* Monospace: cada ★ ocupa lo mismo, así el recorte por % cae justo en la mitad. */}
      <span className="text-papel/20">★★★★★</span>
      <span
        aria-hidden
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-terciopelo transition-[width] duration-100 ease-out"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

function valorDesdePosicion(clientX: number, rect: DOMRect): number {
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return Math.max(1, Math.min(MAX_PUNTUACION, Math.ceil(ratio * MAX_PUNTUACION)));
}

/**
 * Selector de puntuación con medias estrellas. Se apoya en pointer events
 * (mouse, touch y pen unificados) para permitir tocar o arrastrar el dedo
 * sobre las estrellas y previsualizar el valor en vivo antes de soltar.
 */
export function EstrellasInput({
  valor,
  onChange,
  className,
}: {
  valor: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const mostrado = hover ?? valor;

  function actualizar(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return null;
    const v = valorDesdePosicion(clientX, rect);
    setHover(v);
    return v;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLSpanElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrando(true);
    const v = actualizar(e.clientX);
    if (v !== null) onChange(v);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLSpanElement>) {
    if (!arrastrando) return;
    const v = actualizar(e.clientX);
    if (v !== null) onChange(v);
  }

  function soltar() {
    setArrastrando(false);
    setHover(null);
  }

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        ref={ref}
        role="slider"
        aria-label="Puntuación"
        aria-valuemin={0.5}
        aria-valuemax={5}
        aria-valuenow={valor / 2}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={() => !arrastrando && setHover(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            onChange(Math.min(MAX_PUNTUACION, valor + 1));
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            onChange(Math.max(1, valor - 1));
          }
        }}
        className={cn(
          'relative inline-block cursor-pointer touch-none select-none rounded-sm py-2 leading-none outline-none transition-transform focus-visible:ring-2 focus-visible:ring-terciopelo/60',
          arrastrando && 'scale-110',
        )}
      >
        <EstrellasDisplay puntuacion={mostrado} className="text-5xl sm:text-3xl" />
      </span>
      <span className="w-8 shrink-0 font-mono text-sm tabular-nums text-papel/60">
        {(mostrado / 2).toFixed(1)}
      </span>
    </span>
  );
}
