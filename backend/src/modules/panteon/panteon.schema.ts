import { z } from 'zod';

export const agregarAlPanteonSchema = z.object({
  personaId: z.string().uuid(),
});

export const setPeliculaFavoritaSchema = z.object({
  // null para limpiar la elección.
  peliculaFavoritaId: z.string().uuid().nullable(),
});

export const reordenarPanteonSchema = z.object({
  // Los personaId del panteón en el nuevo orden.
  personaIds: z.array(z.string().uuid()).min(1),
});

export type AgregarAlPanteonInput = z.infer<typeof agregarAlPanteonSchema>;
export type SetPeliculaFavoritaInput = z.infer<typeof setPeliculaFavoritaSchema>;
export type ReordenarPanteonInput = z.infer<typeof reordenarPanteonSchema>;
