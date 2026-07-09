import pLimit from 'p-limit';
import { prisma } from '../config/prisma';
import { getTmdbClient } from '../integrations/tmdb/tmdb.client';
import { TMDB_MAX_CONCURRENCIA } from '../config/constants';

/**
 * Backfill puntual de Pelicula.popularity para el catálogo existente (las
 * sincronizaciones futuras la persisten solas). Reanudable: sin --force
 * saltea las películas que ya tienen el dato.
 */
const limit = pLimit(TMDB_MAX_CONCURRENCIA);
const forzar = process.argv.includes('--force');

async function main() {
  const pendientes = await prisma.pelicula.findMany({
    where: forzar ? {} : { popularity: null },
    select: { id: true, tmdbId: true, titulo: true },
  });
  console.log(`${pendientes.length} películas a actualizar\n`);

  let ok = 0;
  let errores = 0;
  await Promise.allSettled(
    pendientes.map((p) =>
      limit(async () => {
        try {
          const detalle = await getTmdbClient().getPeliculaBasica(p.tmdbId);
          await prisma.pelicula.update({
            where: { id: p.id },
            data: { popularity: detalle.popularity ?? null },
          });
          ok++;
        } catch (err) {
          errores++;
          console.error(`  ✗ ${p.titulo}:`, (err as Error).message);
        }
      })
    )
  );

  const conDato = await prisma.pelicula.count({ where: { popularity: { not: null } } });
  console.log(`\nListo: ${ok} actualizadas, ${errores} errores. Con popularidad: ${conDato}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
