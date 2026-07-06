import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variante = 'primario' | 'secundario' | 'fantasma';

const estilos: Record<Variante, string> = {
  // El acento dorado se reserva para la acción principal de cada vista.
  primario: 'bg-marca-cambio text-negro-sala hover:brightness-110 font-medium',
  secundario: 'border border-borde text-papel hover:bg-carbon',
  fantasma: 'text-papel/70 hover:text-papel hover:bg-carbon',
};

export function Boton({
  variante = 'secundario',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2 text-sm',
        'transition-colors disabled:pointer-events-none disabled:opacity-50',
        estilos[variante],
        className
      )}
      {...props}
    />
  );
}
