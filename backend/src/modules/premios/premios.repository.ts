import { prisma } from '../../config/prisma';

export const premioRepository = {
  buscarConGanadores(premioId: string) {
    return prisma.premio.findUnique({
      where: { id: premioId },
      select: {
        id: true,
        nombre: true,
        categoria: true,
        ganados: {
          select: {
            anio: true,
            ganador: true,
            persona: { select: { id: true, nombre: true } },
            pelicula: { select: { id: true, titulo: true } },
          },
          // Ganados arriba dentro de cada año; después, más recientes primero.
          orderBy: [{ anio: 'desc' }, { ganador: 'desc' }],
        },
      },
    });
  },
};
