import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.string().uuid('id inválido'),
});

/** Cómo ordenar el listado. Resuelve las cuatro combinaciones de la UI + alfabético. */
export const ORDENES_LISTADO = [
  'estreno_desc', // más nuevo primero (default)
  'estreno_asc', // más antiguo primero
  'duracion_desc', // más largo primero
  'duracion_asc', // más corto primero
  'titulo_asc', // A–Z
] as const;

export const FRANJAS_DURACION = ['corta', 'media', 'larga'] as const;

/**
 * Umbrales de cada franja, en minutos. Discretas en vez de un rango libre:
 * encaja con el patrón de filtro-por-select y evita que el usuario tenga que
 * pensar en números. `larga` no tiene techo; `corta` arranca desde 0.
 */
export const UMBRALES_DURACION: Record<FranjaDuracion, { gte?: number; lte?: number }> = {
  corta: { lte: 89 },
  media: { gte: 90, lte: 140 },
  larga: { gte: 141 },
};

/** Un `<form method="get">` manda los selects sin elegir como "" — se tratan como ausentes. */
const vacioAUndefined = (v: unknown) => (v === '' ? undefined : v);

export const listarPeliculasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(50).default(20),
  genero: z.preprocess(vacioAUndefined, z.string().min(1).optional()),
  decada: z.preprocess(vacioAUndefined, z.coerce.number().int().min(1900).max(2100).optional()),
  duracion: z.preprocess(vacioAUndefined, z.enum(FRANJAS_DURACION).optional()),
  orden: z.preprocess(vacioAUndefined, z.enum(ORDENES_LISTADO).default('estreno_desc')),
});

export type ListarPeliculasQuery = z.infer<typeof listarPeliculasQuerySchema>;
export type OrdenListado = (typeof ORDENES_LISTADO)[number];
export type FranjaDuracion = (typeof FRANJAS_DURACION)[number];
