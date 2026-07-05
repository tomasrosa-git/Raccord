import { prisma } from '../src/config/prisma';
import { tmdbSyncService } from '../src/integrations/tmdb/tmdb.sync.service';

/**
 * Directores fundacionales del catálogo. Los marcados como `curado` reciben
 * curaduría en profundidad (etapas de carrera, tags de estilo, paleta) en
 * fases posteriores — acá solo se sincronizan los datos de TMDB.
 */
const DIRECTORES_FUNDACIONALES: { nombre: string; curado?: boolean }[] = [
  { nombre: 'Wes Anderson', curado: true },
  { nombre: 'Pedro Almodóvar', curado: true },
  { nombre: 'Bong Joon-ho', curado: true },
  { nombre: 'Lucrecia Martel', curado: true },
  { nombre: 'Alejandro González Iñárritu' },
  { nombre: 'Guillermo del Toro' },
  { nombre: 'Denis Villeneuve' },
  { nombre: 'Sofia Coppola' },
  { nombre: 'Yorgos Lanthimos' },
  { nombre: 'Céline Sciamma' },
  { nombre: 'Park Chan-wook' },
  { nombre: 'Damien Chazelle' },
  { nombre: 'Greta Gerwig' },
  { nombre: 'Alfonso Cuarón' },
  { nombre: 'Fernando Solanas' },
];

async function main() {
  console.log(`Seed: sincronizando ${DIRECTORES_FUNDACIONALES.length} directores desde TMDB\n`);

  let totalPeliculas = 0;
  let totalFallidas = 0;

  for (const director of DIRECTORES_FUNDACIONALES) {
    const tmdbId = await tmdbSyncService.buscarTmdbId(director.nombre);
    if (!tmdbId) {
      console.error(`✗ ${director.nombre}: no se encontró en TMDB`);
      continue;
    }

    const inicio = Date.now();
    const resultado = await tmdbSyncService.syncPersona(tmdbId);
    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

    totalPeliculas += resultado.peliculasSincronizadas;
    totalFallidas += resultado.peliculasFallidas;

    console.log(
      `✓ ${resultado.persona.nombre} (tmdb ${tmdbId}): ` +
        `${resultado.peliculasSincronizadas} películas en ${segundos}s` +
        (resultado.peliculasFallidas ? ` — ${resultado.peliculasFallidas} fallidas` : '') +
        (director.curado ? ' [curado]' : '')
    );
  }

  console.log(`\nSeed completo: ${totalPeliculas} películas sincronizadas, ${totalFallidas} fallidas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
