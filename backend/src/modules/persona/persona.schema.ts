import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const filmografiaQuerySchema = z.object({
  rol: z
    .enum(['DIRECTOR', 'ACTOR', 'GUIONISTA', 'FOTOGRAFIA', 'MONTAJE', 'MUSICA', 'PRODUCTOR'])
    .optional(),
});

export type FilmografiaQuery = z.infer<typeof filmografiaQuerySchema>;
