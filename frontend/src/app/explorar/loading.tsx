import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton, PosterGridSkeleton } from '@/components/ui/Skeleton';

export default function CargandoExplorar() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Explorar</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">El catálogo</h1>

      <div className="mt-8 flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20" />
        ))}
      </div>

      <Skeleton className="mt-6 h-3 w-28" />

      <div className="mt-8">
        <PosterGridSkeleton count={15} />
      </div>
    </div>
  );
}
