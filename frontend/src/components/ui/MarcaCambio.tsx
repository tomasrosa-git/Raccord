import { cn } from '@/lib/utils/cn';

/**
 * Marca de cambio de rollo: el motivo de firma de Raccord.
 * Círculo simple en --color-marca-cambio. Se usa como bullet de sección,
 * indicador de item activo en carruseles y micro-destello en transiciones.
 */
export function MarcaCambio({
  className,
  tamanio = 8,
}: {
  className?: string;
  tamanio?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 rounded-full bg-marca-cambio', className)}
      style={{ width: tamanio, height: tamanio }}
    />
  );
}
