import pLimit from 'p-limit';
import { prisma } from '../config/prisma';
import { extraerPaletaDePelicula } from '../integrations/tmdb/paleta.extractor';
import { TMDB_MAX_CONCURRENCIA } from '../config/constants';

/**
 * Extrae la paleta de color de todas las películas del catálogo que aún no
 * la tienen (con --force reprocesa también las existentes). La firma visual
 * de cada director se calcula a partir de estas paletas, así que este job es
 * lo que enciende ese apartado en los perfiles.
 *
 * Reanudable: si se corta, la próxima corrida retoma por las pendientes.
 */
const limit = pLimit(TMDB_MAX_CONCURRENCIA);
const forzar = process.argv.includes('--force');

async function main() {
  const pendientes = await prisma.pelicula.findMany({
    where: forzar ? {} : { paleta: { none: {} } },
    select: { id: true, tmdbId: true, titulo: true },
    orderBy: { fechaEstreno: { sort: 'asc', nulls: 'last' } },
  });

  console.log(`${pendientes.length} películas a procesar\n`);

  let ok = 0;
  let sinBackdrops = 0;
  let errores = 0;

  await Promise.allSettled(
    pendientes.map((p, i) =>
      limit(async () => {
        try {
          const colores = await extraerPaletaDePelicula(p);
          if (colores > 0) ok++;
          else sinBackdrops++;
          console.log(`  ${colores > 0 ? '✓' : '○'} [${i + 1}/${pendientes.length}] ${p.titulo} (${colores} colores)`);
        } catch (err) {
          errores++;
          console.error(`  ✗ [${i + 1}/${pendientes.length}] ${p.titulo}:`, (err as Error).message);
        }
      })
    )
  );

  const total = await prisma.colorPaleta.count();
  console.log(`\nListo: ${ok} con paleta, ${sinBackdrops} sin backdrops, ${errores} errores.`);
  console.log(`Filas totales en ColorPaleta: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
