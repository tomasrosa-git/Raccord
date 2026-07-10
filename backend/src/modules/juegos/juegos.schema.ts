import { z } from 'zod';

export const intentoBodySchema = z.object({
  peliculaId: z.string().uuid('peliculaId inválido'),
});

export const dueloBodySchema = z.object({
  aId: z.string().uuid('aId inválido'),
  bId: z.string().uuid('bId inválido'),
  elegidaId: z.string().uuid('elegidaId inválido'),
});

export const intrusoBodySchema = z.object({
  ids: z.array(z.string().uuid('id inválido')).length(4, 'La ronda debe tener 4 películas'),
  categoria: z.enum(['director', 'protagonista', 'decada', 'genero']),
  elegidaId: z.string().uuid('elegidaId inválido'),
});
