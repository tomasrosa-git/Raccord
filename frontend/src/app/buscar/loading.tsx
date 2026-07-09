import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton, PosterGridSkeleton } from '@/components/ui/Skeleton';

export default function CargandoBuscar() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Búsqueda</EtiquetaSeccion>
      <Skeleton className="mt-4 h-9 w-2/3 max-w-md" />

      <div className="mt-10 space-y-12">
        <section>
          <EtiquetaSeccion>Cineastas e intérpretes</EtiquetaSeccion>
          <div className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-borde py-3">
                <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <EtiquetaSeccion>Películas</EtiquetaSeccion>
          <div className="mt-4">
            <PosterGridSkeleton count={10} />
          </div>
        </section>
      </div>
    </div>
  );
}
