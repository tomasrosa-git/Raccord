import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { MarcaCambio } from './MarcaCambio';

/**
 * Label de sección: marca de cambio + texto en mono espaciado.
 * Reemplaza la iconografía genérica antes de títulos de sección.
 */
export function EtiquetaSeccion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <MarcaCambio />
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-papel/60">
        {children}
      </span>
    </div>
  );
}
