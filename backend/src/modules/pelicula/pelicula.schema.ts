import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

export const listarPeliculasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  genero: z.string().min(1).optional(),
  anio: z.coerce.number().int().min(1880).max(2100).optional(),
});

export type ListarPeliculasQuery = z.infer<typeof listarPeliculasQuerySchema>;
