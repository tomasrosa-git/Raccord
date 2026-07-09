import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CargandoDecadas() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Décadas</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">
        Lo más importante, década a década
      </h1>
      <Skeleton className="mt-4 h-3 w-80 max-w-full" />

      <div className="mt-14 space-y-16">
        {Array.from({ length: 3 }).map((_, d) => (
          <section key={d}>
            <Skeleton className="h-8 w-32" />
            <div className="mt-6 flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-36 shrink-0 sm:w-44">
                  <Skeleton className="aspect-2/3 w-full rounded-none" />
                  <Skeleton className="mt-2 h-3.5 w-4/5" />
                  <Skeleton className="mt-1.5 h-3 w-8" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
