'use client';

import Link from 'next/link';
import { useListaPropia } from '@/lib/hooks/useListaPropia';
import { anioDe } from '@/lib/utils/formatters';

interface Item {
  id: string;
  texto: string;
  puntuacion: number;
  contieneSpoiler: boolean;
  createdAt: string;
  pelicula: { id: string; titulo: string; fechaEstreno: string | null };
}

export default function MisReviews() {
  const { items, cargando } = useListaPropia<Item>('/usuarios/me/reviews');

  if (cargando) return <p className="font-mono text-sm text-papel/40">Cargando…</p>;
  if (!items || items.length === 0) {
    return <p className="text-papel/60">Todavía no escribiste reseñas.</p>;
  }

  return (
    <ul>
      {items.map((r) => (
        <li key={r.id} className="border-b border-borde py-5">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <Link
              href={`/pelicula/${r.pelicula.id}`}
              className="text-papel underline-offset-4 hover:underline"
            >
              {r.pelicula.titulo}
            </Link>
            {anioDe(r.pelicula.fechaEstreno) && (
              <span className="font-mono text-xs text-papel/40">
                {anioDe(r.pelicula.fechaEstreno)}
              </span>
            )}
            <span className="font-mono text-sm text-terciopelo">
              {'★'.repeat(r.puntuacion)}
              <span className="text-papel/20">{'★'.repeat(5 - r.puntuacion)}</span>
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-papel/70">{r.texto}</p>
        </li>
      ))}
    </ul>
  );
}
