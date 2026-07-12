import { ListaReviews } from '@/components/reviews/ListaReviews';

/** Reseñas de la obra de un director. Wrapper del componente genérico. */
export function ReviewsDirector({ personaId }: { personaId: string }) {
  return (
    <ListaReviews
      titulo="Reseñas de su obra"
      recursoPath={`/personas/${personaId}`}
      reviewPath="/reviews-persona"
      placeholder="Qué te parece su cine, cómo evolucionó, qué lo hace reconocible…"
      promptVacio="Todavía no hay reseñas de este director. Abrí el debate."
    />
  );
}
