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
// `forzarResync` ignora `--solo-nuevos`: para directores que ya tienen
// créditos en la base pero incompletos (entraron de rebote como
// co-directores en películas de otros directores curados, ej. filmes de
// segmentos) — hay que volver a traer la filmografía completa.
const DIRECTORES: {
  nombre: string;
  curado?: boolean;
  tmdbId?: number;
  nombreForzado?: boolean;
  forzarResync?: boolean;
}[] = [
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

  // --- Tercera tanda (Fase 15): 48 autores mayores que faltaban, para dar
  //     profundidad histórica y geográfica. IDs resueltos vía TMDB y
  //     verificados por departamento (Directing) + descartando los ya presentes.
  //     Clásicos europeos
  { nombre: 'Ingmar Bergman', tmdbId: 6648 },
  { nombre: 'François Truffaut', tmdbId: 1650 },
  { nombre: 'Michelangelo Antonioni', tmdbId: 15189 },
  { nombre: 'Robert Bresson', tmdbId: 10346 },
  { nombre: 'Jean Renoir', tmdbId: 11528 },
  { nombre: 'Luchino Visconti', tmdbId: 15127 },
  { nombre: 'Vittorio De Sica', tmdbId: 12329 },
  { nombre: 'Roberto Rossellini', tmdbId: 4410 },
  { nombre: 'Pier Paolo Pasolini', tmdbId: 5970 },
  { nombre: 'Jacques Tati', tmdbId: 5763 },
  { nombre: 'Louis Malle', tmdbId: 15389 },
  { nombre: 'Jacques Demy', tmdbId: 24882 },
  { nombre: 'Andrzej Wajda', tmdbId: 2801 },
  { nombre: 'Chantal Akerman', tmdbId: 130030 },
  { nombre: 'Béla Tarr', tmdbId: 85637, nombreForzado: true },
  //     Alemania / norte / este de Europa
  { nombre: 'Rainer Werner Fassbinder', tmdbId: 2725 },
  { nombre: 'Werner Herzog', tmdbId: 6818 },
  { nombre: 'Michael Haneke', tmdbId: 6011 },
  { nombre: 'Ruben Östlund', tmdbId: 56370 },
  { nombre: 'Paweł Pawlikowski', tmdbId: 64194 },
  { nombre: 'Cristian Mungiu', tmdbId: 20657 },
  //     Asia
  { nombre: 'Yasujirō Ozu', tmdbId: 95501 },
  { nombre: 'Kenji Mizoguchi', tmdbId: 97202 },
  { nombre: 'Hirokazu Kore-eda', tmdbId: 25645, nombreForzado: true },
  { nombre: 'Edward Yang', tmdbId: 143035, nombreForzado: true },
  { nombre: 'Ang Lee', tmdbId: 1614 },
  { nombre: 'Satyajit Ray', tmdbId: 12160 },
  { nombre: 'Asghar Farhadi', tmdbId: 229931 },
  { nombre: 'Nuri Bilge Ceylan', tmdbId: 56214 },
  //     Estados Unidos
  { nombre: 'Terrence Malick', tmdbId: 30715 },
  { nombre: 'David Fincher', tmdbId: 7467 },
  { nombre: 'Christopher Nolan', tmdbId: 525 },
  { nombre: 'Robert Altman', tmdbId: 9789 },
  { nombre: 'John Cassavetes', tmdbId: 11147 },
  { nombre: 'Jim Jarmusch', tmdbId: 4429 },
  { nombre: 'Orson Welles', tmdbId: 40 },
  { nombre: 'Billy Wilder', tmdbId: 3146 },
  { nombre: 'Sidney Lumet', tmdbId: 39996 },
  { nombre: 'Charlie Kaufman', tmdbId: 202 },
  { nombre: 'Ari Aster', tmdbId: 1145520 },
  { nombre: 'Robert Eggers', tmdbId: 138781 },
  { nombre: 'Jordan Peele', tmdbId: 291263 },
  { nombre: 'Richard Linklater', tmdbId: 564 },
  //     Latinoamérica
  { nombre: 'Carlos Reygadas', tmdbId: 20660 },
  { nombre: 'Fernando Meirelles', tmdbId: 8557 },
  { nombre: 'Lisandro Alonso', tmdbId: 1002601 },
  { nombre: 'Gaspar Noé', tmdbId: 14597 },
  { nombre: 'Alejandro Jodorowsky', tmdbId: 55119 },

  // --- Cuarta tanda (Fase 24): completar filmografías incompletas + canon
  //     histórico faltante + directores de franquicias masivas (Marvel,
  //     Star Wars, DC y otras), que además suman al catálogo a los actores
  //     más conocidos como reparto. IDs verificados a mano vía búsqueda TMDB
  //     por departamento (Directing) + popularidad, descartando homónimos.
  //     Completar filmografía: ya estaban en la base con créditos parciales
  //     (entraron de rebote como co-directores en películas de otros
  //     directores curados, ej. filmes de segmentos). Ya resincronizados
  //     por completo — sin `forzarResync` para no repetir el trabajo.
  { nombre: 'Jean-Luc Godard', tmdbId: 3776 },
  { nombre: 'Federico Fellini', tmdbId: 4415 },
  { nombre: 'Francis Ford Coppola', tmdbId: 1776 },
  { nombre: 'Joel Coen', tmdbId: 1223 },
  { nombre: 'Ethan Coen', tmdbId: 1224 },
  { nombre: 'Woody Allen', tmdbId: 1243 },
  { nombre: 'Roman Polanski', tmdbId: 3556 },
  { nombre: 'Ridley Scott', tmdbId: 578 },
  { nombre: 'Spike Lee', tmdbId: 5281 },
  { nombre: 'Ken Loach', tmdbId: 15488 },
  { nombre: 'Claude Chabrol', tmdbId: 19069 },
  { nombre: 'Alain Resnais', tmdbId: 11983 },
  { nombre: 'Jacques Rivette', tmdbId: 73153 },
  { nombre: 'Chris Marker', tmdbId: 9956 },
  { nombre: 'Costa-Gavras', tmdbId: 27436 },
  { nombre: 'Zhang Yimou', tmdbId: 607 },
  { nombre: 'Víctor Erice', tmdbId: 37833 },
  { nombre: 'Walter Salles', tmdbId: 8574 },
  { nombre: 'Isabel Coixet', tmdbId: 90 },
  { nombre: 'Taika Waititi', tmdbId: 55934 },
  { nombre: 'Jon Favreau', tmdbId: 15277 },
  //     Canon histórico faltante. `forzarResync` en los que ya habían
  //     entrado parciales por el mismo mecanismo de rebote (detectado
  //     recién en esta corrida: "ya existentes salteados").
  { nombre: 'Krzysztof Kieślowski', tmdbId: 1126, forzarResync: true },
  { nombre: 'David Cronenberg', tmdbId: 224, forzarResync: true },
  { nombre: 'Sergio Leone', tmdbId: 4385, forzarResync: true },
  { nombre: 'Fritz Lang', tmdbId: 68 },
  { nombre: 'Sergei Eisenstein', tmdbId: 9603, nombreForzado: true },
  { nombre: 'Jane Campion', tmdbId: 10757, forzarResync: true },
  { nombre: 'Kathryn Bigelow', tmdbId: 14392 },
  { nombre: 'Paul Verhoeven', tmdbId: 10491, forzarResync: true },
  { nombre: 'Terry Gilliam', tmdbId: 280, forzarResync: true },
  { nombre: 'Carlos Saura', tmdbId: 96369, forzarResync: true },
  { nombre: 'Pablo Trapero', tmdbId: 56210, forzarResync: true },
  { nombre: 'Mariano Llinás', tmdbId: 1293509 },
  { nombre: 'Lucía Puenzo', tmdbId: 69309 },
  { nombre: 'Santiago Mitre', tmdbId: 84677 },
  { nombre: 'Michel Franco', tmdbId: 1082434 },
  //     Franquicias masivas (Marvel, Star Wars, DC y otras)
  { nombre: 'George Lucas', tmdbId: 1, forzarResync: true },
  { nombre: 'J.J. Abrams', tmdbId: 15344 },
  { nombre: 'Rian Johnson', tmdbId: 67367 },
  { nombre: 'Anthony Russo', tmdbId: 19271 },
  { nombre: 'Joe Russo', tmdbId: 19272, forzarResync: true },
  { nombre: 'James Gunn', tmdbId: 15218 },
  { nombre: 'Ryan Coogler', tmdbId: 1056121 },
  { nombre: 'Sam Raimi', tmdbId: 7623 },
  { nombre: 'Joss Whedon', tmdbId: 12891 },
  { nombre: 'Zack Snyder', tmdbId: 15217 },
  { nombre: 'Matt Reeves', tmdbId: 32278 },
  { nombre: 'Peter Jackson', tmdbId: 108 },
  { nombre: 'David Yates', tmdbId: 11343 },
  { nombre: 'Gareth Edwards', tmdbId: 129894 },
  { nombre: 'Colin Trevorrow', tmdbId: 930707 },
  { nombre: 'J.A. Bayona', tmdbId: 51894 },
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

    if (soloNuevos && !director.forzarResync && (await yaSincronizado(tmdbId))) {
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
