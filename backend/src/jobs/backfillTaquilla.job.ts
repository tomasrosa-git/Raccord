import pLimit from 'p-limit';
import { prisma } from '../config/prisma';
import { getTmdbClient } from '../integrations/tmdb/tmdb.client';
import { TMDB_MAX_CONCURRENCIA } from '../config/constants';

/**
 * Backfill puntual de Pelicula.presupuesto / recaudacion (budget/revenue de TMDB)
 * para el catálogo existente; las sincronizaciones futuras los persisten solos.
 * Reanudable: sin --force saltea las que ya tienen recaudación cargada.
 * TMDB devuelve 0 cuando no tiene el dato → se guarda null (ausencia, no cero).
 */
const limit = pLimit(TMDB_MAX_CONCURRENCIA);
const forzar = process.argv.includes('--force');

async function main() {
  const pendientes = await prisma.pelicula.findMany({
    where: forzar ? {} : { recaudacion: null },
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
            data: {
              presupuesto: detalle.budget > 0 ? detalle.budget : null,
              recaudacion: detalle.revenue > 0 ? detalle.revenue : null,
            },
          });
          ok++;
        } catch (err) {
          errores++;
          console.error(`  ✗ ${p.titulo}:`, (err as Error).message);
        }
      })
    )
  );

  const conDato = await prisma.pelicula.count({ where: { recaudacion: { not: null } } });
  console.log(`\nListo: ${ok} actualizadas, ${errores} errores. Con recaudación: ${conDato}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
