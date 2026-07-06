import { z } from 'zod';

export const crearReviewSchema = z.object({
  texto: z.string().min(1, 'La reseña no puede estar vacía').max(5000),
  puntuacion: z.number().int().min(1).max(5),
  contieneSpoiler: z.boolean().default(false),
});

export const editarReviewSchema = crearReviewSchema.partial();

export type CrearReviewInput = z.infer<typeof crearReviewSchema>;
export type EditarReviewInput = z.infer<typeof editarReviewSchema>;
