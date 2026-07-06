import Link from 'next/link';
import Image from 'next/image';
import { anioDe } from '@/lib/utils/formatters';

/**
 * Miniatura de película para tiras de contact sheet y grillas.
 * Sobria a propósito: la personalidad vive en heros y perfiles.
 */
export function PosterCard({
  pelicula,
}: {
  pelicula: {
    id: string;
    titulo: string;
    fechaEstreno: string | null;
    posterUrl: string | null;
  };
}) {
  const anio = anioDe(pelicula.fechaEstreno);
  return (
    <Link href={`/pelicula/${pelicula.id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden bg-carbon">
        {pelicula.posterUrl ? (
          <Image
            src={pelicula.posterUrl}
            alt={`Póster de ${pelicula.titulo}`}
            fill
            sizes="(max-width: 640px) 40vw, 180px"
            className="object-cover transition-opacity group-hover:opacity-80"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-mono text-xs text-papel/30">
            {pelicula.titulo}
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-snug text-papel/90 group-hover:text-papel">
        {pelicula.titulo}
      </p>
      {anio && <p className="font-mono text-xs text-papel/40">{anio}</p>}
    </Link>
  );
}
