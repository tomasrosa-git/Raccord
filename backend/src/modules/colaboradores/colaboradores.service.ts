import { AppError } from '../../shared/errors/AppError';
import { conCache } from '../../shared/utils/cache';
import { CACHE_TTL_SEGUNDOS } from '../../config/constants';
import { prisma } from '../../config/prisma';
import { colaboradoresRepository } from './colaboradores.repository';

const MIN_COLABORACIONES = 2;
const MAX_COLABORADORES = 20;

async function calcularColaboradores(personaId: string) {
  const persona = await prisma.persona.findUnique({ where: { id: personaId }, select: { id: true } });
  if (!persona) throw AppError.notFound('Persona no encontrada');

  const peliculaIds = await colaboradoresRepository.peliculasDirigidasPor(personaId);
  if (peliculaIds.length === 0) return [];

  const conteos = await colaboradoresRepository.contarColaboraciones(peliculaIds, personaId);

  // Agrupar por persona: total de colaboraciones y desglose por rol.
  const porPersona = new Map<string, { total: number; roles: Record<string, number> }>();
  for (const c of conteos) {
    const actual = porPersona.get(c.personaId) ?? { total: 0, roles: {} };
    actual.total += c._count.peliculaId;
    actual.roles[c.rol] = c._count.peliculaId;
    porPersona.set(c.personaId, actual);
  }

  const frecuentes = [...porPersona.entries()]
    .filter(([, datos]) => datos.total >= MIN_COLABORACIONES)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, MAX_COLABORADORES);

  const personas = await colaboradoresRepository.buscarPersonasResumen(frecuentes.map(([id]) => id));
  const personaPorId = new Map(personas.map((p) => [p.id, p]));

  return frecuentes.map(([id, datos]) => ({
    ...personaPorId.get(id)!,
    colaboraciones: datos.total,
    porRol: datos.roles,
  }));
}

export const colaboradoresService = {
  obtener(personaId: string) {
    return conCache(
      `colaboradores:${personaId}`,
      CACHE_TTL_SEGUNDOS.colaboradores,
      () => calcularColaboradores(personaId)
    );
  },
};
