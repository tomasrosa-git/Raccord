import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/** Chip para specs técnicas y géneros: mono, borde fino, sin relleno. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-borde px-2 py-0.5',
        'font-mono text-xs text-papel/70',
        className
      )}
    >
      {children}
    </span>
  );
}
