import { AppError } from '../../shared/errors/AppError';
import { conCache } from '../../shared/utils/cache';
import { CACHE_TTL_SEGUNDOS } from '../../config/constants';
import { prisma } from '../../config/prisma';

const COLORES_POR_PELICULA = 4;

/**
 * Firma visual del director: timeline cronológica de swatches de color,
 * una entrada por película dirigida que tenga paleta extraída.
 */
async function calcularFirmaVisual(personaId: string) {
  const persona = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true } });
  if (!persona) throw AppError.notFound('Persona no encontrada');

  const creditos = await prisma.creditoPelicula.findMany({
    where: { personaId, rol: 'DIRECTOR' },
    select: {
      pelicula: {
        select: {
          id: true,
          titulo: true,
          fechaEstreno: true,
          posterUrl: true,
          paleta: {
            select: { colorHex: true, porcentaje: true },
            orderBy: { porcentaje: 'desc' },
            take: COLORES_POR_PELICULA,
          },
        },
      },
    },
    orderBy: { pelicula: { fechaEstreno: { sort: 'asc', nulls: 'last' } } },
  });

  return creditos
    .filter((c) => c.pelicula.paleta.length > 0)
    .map((c) => {
      // Dedupe por hex para datos extraídos antes de que el extractor consolidara.
      const vistos = new Set<string>();
      const colores = c.pelicula.paleta.filter((p) =>
        vistos.has(p.colorHex) ? false : (vistos.add(p.colorHex), true)
      );
      return {
        peliculaId: c.pelicula.id,
        titulo: c.pelicula.titulo,
        anio: c.pelicula.fechaEstreno?.getFullYear() ?? null,
        posterUrl: c.pelicula.posterUrl,
        colores,
      };
    });
}

export const paletaService = {
  obtenerFirmaVisual(personaId: string) {
    return conCache(
      `firma-visual:${personaId}`,
      CACHE_TTL_SEGUNDOS.firmaVisual,
      () => calcularFirmaVisual(personaId)
    );
  },
};
