import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

/** Input sobrio: los formularios no llevan personalidad fuerte. */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-sm border border-borde bg-carbon px-3 py-2 text-sm text-papel',
        'placeholder:text-papel/40',
        'focus:border-papel/40 focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
