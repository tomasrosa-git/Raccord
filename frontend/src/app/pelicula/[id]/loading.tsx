import { Skeleton } from '@/components/ui/Skeleton';

export default function CargandoPelicula() {
  return (
    <article>
      {/* Hero letterbox */}
      <div className="bg-black">
        <div aria-hidden className="h-8 sm:h-12" />
        <div className="relative mx-auto max-h-[62vh] max-w-6xl" style={{ aspectRatio: 1.85 }}>
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div aria-hidden className="h-8 sm:h-12" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-11/12 max-w-2xl" />
            <Skeleton className="h-4 w-3/4 max-w-2xl" />
          </div>

          <aside className="space-y-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-40 w-full" />
          </aside>
        </div>
      </div>
    </article>
  );
}
