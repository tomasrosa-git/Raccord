import { z } from 'zod';

export const intentoBodySchema = z.object({
  peliculaId: z.string().uuid('peliculaId inválido'),
});
