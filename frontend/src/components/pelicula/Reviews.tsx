import { ListaReviews } from '@/components/reviews/ListaReviews';

/** Reseñas de una película. Wrapper del componente genérico de reseñas. */
export function Reviews({ peliculaId }: { peliculaId: string }) {
  return (
    <ListaReviews
      titulo="Reseñas"
      recursoPath={`/peliculas/${peliculaId}`}
      reviewPath="/reviews"
      placeholder="Qué te dejó la película…"
      promptVacio="Todavía no hay reseñas. Sé la primera voz."
    />
  );
}
