import { prisma } from '../../config/prisma';

export const colaboradoresRepository = {
  /** IDs de películas dirigidas por la persona. */
  async peliculasDirigidasPor(personaId: string) {
    const creditos = await prisma.creditoPelicula.findMany({
      where: { personaId, rol: 'DIRECTOR' },
      select: { peliculaId: true },
    });
    return creditos.map((c) => c.peliculaId);
  },

  /**
   * Colaboradores agrupados por persona y rol sobre un conjunto de películas.
   * Una sola query agregada — posible porque Persona es un modelo unificado
   * y el rol vive en CreditoPelicula.
   */
  contarColaboraciones(peliculaIds: string[], excluirPersonaId: string) {
    return prisma.creditoPelicula.groupBy({
      by: ['personaId', 'rol'],
      where: {
        peliculaId: { in: peliculaIds },
        personaId: { not: excluirPersonaId },
      },
      _count: { peliculaId: true },
    });
  },

  buscarPersonasResumen(ids: string[]) {
    return prisma.persona.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, fotoUrl: true },
    });
  },
};
