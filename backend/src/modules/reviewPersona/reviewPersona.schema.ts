import { z } from 'zod';

// Reseña de la obra de un director. Puntuación en medias estrellas: 1..10.
export const crearReviewPersonaSchema = z.object({
  texto: z.string().min(1, 'La reseña no puede estar vacía').max(5000),
  puntuacion: z.number().int().min(1).max(10),
  contieneSpoiler: z.boolean().default(false),
});

export const editarReviewPersonaSchema = crearReviewPersonaSchema.partial();

export type CrearReviewPersonaInput = z.infer<typeof crearReviewPersonaSchema>;
export type EditarReviewPersonaInput = z.infer<typeof editarReviewPersonaSchema>;
