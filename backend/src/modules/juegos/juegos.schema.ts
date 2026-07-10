import { z } from 'zod';

export const intentoBodySchema = z.object({
  peliculaId: z.string().uuid('peliculaId inválido'),
});

export const dueloBodySchema = z.object({
  aId: z.string().uuid('aId inválido'),
  bId: z.string().uuid('bId inválido'),
  elegidaId: z.string().uuid('elegidaId inválido'),
});
