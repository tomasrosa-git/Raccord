import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CargandoDirectores() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Directores</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Los cineastas del catálogo</h1>
      <Skeleton className="mt-3 h-3 w-24" />

      <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="text-center">
            <Skeleton className="mx-auto aspect-square w-full max-w-[160px] rounded-full" />
            <Skeleton className="mx-auto mt-3 h-3.5 w-24" />
            <Skeleton className="mx-auto mt-1.5 h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
