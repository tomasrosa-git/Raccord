import pLimit from 'p-limit';
import { prisma } from '../config/prisma';
import { extraerPaletaDePelicula } from '../integrations/tmdb/paleta.extractor';
import { TMDB_MAX_CONCURRENCIA } from '../config/constants';

// Directores curados en profundidad: paleta extraída desde el día 1.
const TMDB_IDS_CURADOS = [
  5655, // Wes Anderson
  309, // Pedro Almodóvar
  21684, // Bong Joon-ho
  56208, // Lucrecia Martel
];

const limit = pLimit(TMDB_MAX_CONCURRENCIA);
const forzar = process.argv.includes('--force');

async function main() {
  const directores = await prisma.persona.findMany({
    where: { tmdbId: { in: TMDB_IDS_CURADOS } },
    select: { id: true, nombre: true },
  });

  for (const director of directores) {
    const creditos = await prisma.creditoPelicula.findMany({
      where: { personaId: director.id, rol: 'DIRECTOR' },
      select: {
        pelicula: {
          select: { id: true, tmdbId: true, titulo: true, _count: { select: { paleta: true } } },
        },
      },
    });

    // Sin --force se saltean películas con paleta existente (job reanudable).
    const pendientes = creditos
      .map((c) => c.pelicula)
      .filter((p) => forzar || p._count.paleta === 0);

    console.log(`\n${director.nombre}: ${pendientes.length} películas a procesar`);

    const resultados = await Promise.allSettled(
      pendientes.map((p) =>
        limit(async () => {
          const colores = await extraerPaletaDePelicula(p);
          console.log(`  ${colores > 0 ? '✓' : '○'} ${p.titulo} (${colores} colores)`);
          return colores;
        })
      )
    );

    for (const [i, r] of resultados.entries()) {
      if (r.status === 'rejected') {
        console.error(`  ✗ ${pendientes[i]!.titulo}:`, (r.reason as Error).message);
      }
    }
  }

  const total = await prisma.colorPaleta.count();
  console.log(`\nListo. Filas totales en ColorPaleta: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
