'use client';

import { PosterCard } from '@/components/pelicula/PosterCard';
import { useListaPropia } from '@/lib/hooks/useListaPropia';

interface Item {
  pelicula: {
    id: string;
    titulo: string;
    fechaEstreno: string | null;
    posterUrl: string | null;
  };
}

export default function MisLikes() {
  const { items, cargando } = useListaPropia<Item>('/usuarios/me/likes');

  if (cargando) return <p className="font-mono text-sm text-papel/40">Cargando…</p>;
  if (!items || items.length === 0) {
    return <p className="text-papel/60">Todavía no marcaste películas que te gustaron.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <PosterCard key={item.pelicula.id} pelicula={item.pelicula} />
      ))}
    </div>
  );
}
