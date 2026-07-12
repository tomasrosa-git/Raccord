'use client';

import { useState } from 'react';
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
        className="absolute inset-0 overflow-hidden whitespace-nowrap text-terciopelo"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

/**
 * Selector de puntuación con medias estrellas. 10 zonas invisibles (media
 * estrella cada una) superpuestas sobre el display; el hover previsualiza.
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
  const [hover, setHover] = useState<number | null>(null);
  const mostrado = hover ?? valor;

  return (
    <span
      className={cn('relative inline-flex', className)}
      role="slider"
      aria-label="Puntuación"
      aria-valuemin={0.5}
      aria-valuemax={5}
      aria-valuenow={valor / 2}
    >
      <EstrellasDisplay puntuacion={mostrado} className="text-2xl" />
      <span className="absolute inset-0 flex" onMouseLeave={() => setHover(null)}>
        {Array.from({ length: MAX_PUNTUACION }).map((_, i) => {
          const v = i + 1;
          return (
            <button
              key={v}
              type="button"
              onMouseEnter={() => setHover(v)}
              onClick={() => onChange(v)}
              aria-label={`${v / 2} ${v === 2 ? 'estrella' : 'estrellas'}`}
              className="h-full flex-1 cursor-pointer"
            />
          );
        })}
      </span>
    </span>
  );
}
