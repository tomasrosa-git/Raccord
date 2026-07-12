'use client';

import Link from 'next/link';
import { useListaPropia } from '@/lib/hooks/useListaPropia';
import { Skeleton } from '@/components/ui/Skeleton';
import { EstrellasDisplay } from '@/components/ui/Estrellas';

interface Item {
  id: string;
  texto: string;
  puntuacion: number;
  contieneSpoiler: boolean;
  createdAt: string;
  persona: { id: string; nombre: string; fotoUrl: string | null };
}

export default function MisReviewsDirectores() {
  const { items, cargando } = useListaPropia<Item>('/usuarios/me/reviews-persona');

  if (cargando) {
    return (
      <ul>
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i} className="border-b border-borde py-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="mt-3 h-3 w-full max-w-2xl" />
            <Skeleton className="mt-2 h-3 w-2/3 max-w-2xl" />
          </li>
        ))}
      </ul>
    );
  }
  if (!items || items.length === 0) {
    return <p className="text-papel/60">Todavía no reseñaste directores.</p>;
  }

  return (
    <ul>
      {items.map((r) => (
        <li key={r.id} className="border-b border-borde py-5">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <Link
              href={`/cineasta/${r.persona.id}`}
              className="text-papel underline-offset-4 hover:underline"
            >
              {r.persona.nombre}
            </Link>
            <EstrellasDisplay puntuacion={r.puntuacion} className="text-sm" />
          </div>
          <p className="mt-2 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-papel/70">
            {r.texto}
          </p>
        </li>
      ))}
    </ul>
  );
}
