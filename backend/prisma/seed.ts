import { prisma } from '../src/config/prisma';
import { tmdbSyncService } from '../src/integrations/tmdb/tmdb.sync.service';

/**
 * Directores del catálogo. Los marcados como `curado` reciben curaduría en
 * profundidad (etapas de carrera, tags de estilo, paleta) — el resto arranca
 * con datos automáticos de TMDB.
 *
 * Con `--solo-nuevos` se saltean los que ya tienen créditos de dirección en
 * la base (corridas incrementales sin re-consultar TMDB por los existentes).
 */
// `tmdbId` explícito para nombres con homónimos donde la búsqueda es ambigua.
// `nombreForzado` pisa el nombre canónico de TMDB tras el sync — para casos
// como Wong Kar-wai, cuyo nombre primario en TMDB está en caracteres chinos
// (王家衛) y sería inencontrable para el público hispanohablante.
const DIRECTORES: { nombre: string; curado?: boolean; tmdbId?: number; nombreForzado?: boolean }[] = [
  // --- Primera tanda: los 15 fundacionales ---
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
  { nombre: 'Fernando "Pino" Solanas', tmdbId: 71353 },

  // --- Segunda tanda (Fase 12): clásicos, modernos y refuerzo hispano/LatAm.
  //     IDs verificados a mano contra TMDB (dry-run con fecha de nacimiento).
  { nombre: 'Luis Buñuel', tmdbId: 793 },
  { nombre: 'Juan José Campanella', tmdbId: 84714 },
  { nombre: 'Pablo Larraín', tmdbId: 225009 },
  { nombre: 'Damián Szifron', tmdbId: 591600 },
  { nombre: 'Stanley Kubrick', tmdbId: 240 },
  { nombre: 'Alfred Hitchcock', tmdbId: 2636 },
  { nombre: 'Akira Kurosawa', tmdbId: 5026 },
  { nombre: 'Andrei Tarkovsky', tmdbId: 8452 },
  { nombre: 'Agnès Varda', tmdbId: 6817 },
  { nombre: 'Wong Kar-wai', tmdbId: 12453, nombreForzado: true },
  { nombre: 'David Lynch', tmdbId: 5602 },
  { nombre: 'Hayao Miyazaki', tmdbId: 608 },
  { nombre: 'Quentin Tarantino', tmdbId: 138 },
  { nombre: 'Martin Scorsese', tmdbId: 1032 },
  { nombre: 'Paul Thomas Anderson', tmdbId: 4762 },
];

/** true si la persona ya está sincronizada como director (tiene créditos de dirección). */
async function yaSincronizado(tmdbId: number): Promise<boolean> {
  const persona = await prisma.persona.findUnique({
    where: { tmdbId },
    select: { _count: { select: { creditos: { where: { rol: 'DIRECTOR' } } } } },
  });
  return (persona?._count.creditos ?? 0) > 0;
}

async function main() {
  const soloNuevos = process.argv.includes('--solo-nuevos');
  console.log(
    `Seed: ${DIRECTORES.length} directores${soloNuevos ? ' (solo los que faltan)' : ''}\n`
  );

  let totalPeliculas = 0;
  let totalFallidas = 0;
  let salteados = 0;

  for (const director of DIRECTORES) {
    const tmdbId = director.tmdbId ?? (await tmdbSyncService.buscarTmdbId(director.nombre));
    if (!tmdbId) {
      console.error(`✗ ${director.nombre}: no se encontró en TMDB`);
      continue;
    }

    // El nombre canónico se fuerza aunque el director ya esté sincronizado:
    // TMDB puede haberlo creado como crew de otra película con su nombre
    // primario (ej. Wong Kar-wai → 王家衛) antes de llegar a su turno.
    const forzarNombre = async () => {
      if (director.nombreForzado) {
        await prisma.persona.updateMany({ where: { tmdbId }, data: { nombre: director.nombre } });
      }
    };

    if (soloNuevos && (await yaSincronizado(tmdbId))) {
      await forzarNombre();
      salteados++;
      continue;
    }

    const inicio = Date.now();
    const resultado = await tmdbSyncService.syncPersona(tmdbId);
    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

    await forzarNombre();

    totalPeliculas += resultado.peliculasSincronizadas;
    totalFallidas += resultado.peliculasFallidas;

    console.log(
      `✓ ${resultado.persona.nombre} (tmdb ${tmdbId}): ` +
        `${resultado.peliculasSincronizadas} películas en ${segundos}s` +
        (resultado.peliculasFallidas ? ` — ${resultado.peliculasFallidas} fallidas` : '') +
        (director.curado ? ' [curado]' : '')
    );
  }

  console.log(
    `\nSeed completo: ${totalPeliculas} películas sincronizadas, ${totalFallidas} fallidas` +
      (salteados ? `, ${salteados} directores ya existentes salteados.` : '.')
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
