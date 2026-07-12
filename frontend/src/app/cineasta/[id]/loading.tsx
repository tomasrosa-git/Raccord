import { Skeleton } from '@/components/ui/Skeleton';

/** Tira horizontal de pósters, como FilmografiaTira mientras carga. */
function TiraSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-44" />
      <div className="mt-6 flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 sm:w-44">
            <Skeleton className="aspect-2/3 w-full rounded-none" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CargandoCineasta() {
  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end">
        <Skeleton className="h-48 w-36 shrink-0 rounded-none sm:h-56 sm:w-40" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-11 w-64 sm:h-14 sm:w-96" />
          <Skeleton className="mt-4 h-3 w-56" />
        </div>
      </header>

      <div className="mt-16 space-y-16">
        <TiraSkeleton />
        <TiraSkeleton />
      </div>
    </article>
  );
}
