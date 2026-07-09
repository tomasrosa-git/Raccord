import { cn } from '@/lib/utils/cn';

/**
 * Placeholder de carga: bloque que pulsa mientras llegan los datos. Evita el
 * salto de "todo en blanco" a "todo cargado". Usa carbón sobre negro de sala.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-sm bg-carbon', className)} />;
}

/** Skeleton de una PosterCard: póster 2:3 + dos líneas de texto. */
export function PosterCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-2/3 w-full rounded-none" />
      <Skeleton className="mt-2 h-3.5 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-8" />
    </div>
  );
}

/** Grilla de pósters igual que /explorar, /buscar y mi-cuenta. */
export function PosterGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <PosterCardSkeleton key={i} />
      ))}
    </div>
  );
}
