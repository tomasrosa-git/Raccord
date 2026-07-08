import { prisma } from '../src/config/prisma';

/**
 * Carga de premios reales para los 4 directores curados, desde Wikidata vía
 * SPARQL (gratis, sin API key). Proceso puntual/manual — NO corre en el cron.
 *
 *   npm run seed:premios   (backend/)
 *
 * Fuente: premios registrados a nivel PERSONA en Wikidata (P166 "premio
 * recibido" y P1411 "nominado a"), con año (P585) y obra (P1686). Esto atribuye
 * cada premio al director como persona — a diferencia de mirar los premios de
 * la película, que mezclaría galardones de actores/fotografía/etc.
 *
 * Cada premio pasa por AWARD_MAP (QID → nombre + categoría): funciona a la vez
 * como allowlist (los premios no mapeados se descartan — honores civiles,
 * doctorados honoris causa, ceremonias genéricas sin categoría) y como
 * normalización de nombres al español.
 *
 * Idempotente: borra los PremioGanado de estos 4 y reinserta; reusa filas de
 * Premio existentes (find-or-create por nombre+categoría) y limpia huérfanos.
 */

const USER_AGENT = 'Raccord/1.0 (portfolio cine de autor; rosatomas.contact@gmail.com)';
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

/** Los 4 curados: QID de Wikidata ↔ TMDB person id (así los encontramos en la DB). */
const CURADOS: { nombre: string; qid: string; tmdbPersonId: number }[] = [
  { nombre: 'Wes Anderson', qid: 'Q223687', tmdbPersonId: 5655 },
  { nombre: 'Pedro Almodóvar', qid: 'Q55171', tmdbPersonId: 309 },
  { nombre: 'Bong Joon-ho', qid: 'Q495980', tmdbPersonId: 21684 },
  { nombre: 'Lucrecia Martel', qid: 'Q254152', tmdbPersonId: 56208 },
];

/**
 * QID de premio (Wikidata) → cómo lo mostramos. Solo los premios acá listados
 * se cargan; el resto se descarta. Curado a mano a partir del volcado real de
 * SPARQL para los 4 directores.
 */
const AWARD_MAP: Record<string, { nombre: string; categoria: string }> = {
  // --- Premios Óscar ---
  Q102427: { nombre: 'Premios Óscar', categoria: 'Mejor película' },
  Q106800: { nombre: 'Premios Óscar', categoria: 'Mejor película de animación' },
  Q105304: { nombre: 'Premios Óscar', categoria: 'Mejor película internacional' },
  Q1324407: { nombre: 'Premios Óscar', categoria: 'Mejor cortometraje' },
  Q103360: { nombre: 'Premios Óscar', categoria: 'Mejor dirección' },
  Q41417: { nombre: 'Premios Óscar', categoria: 'Mejor guion original' },
  // --- Festival de Cannes ---
  Q179808: { nombre: 'Festival de Cannes', categoria: 'Palma de Oro' },
  Q510175: { nombre: 'Festival de Cannes', categoria: 'Mejor dirección' },
  Q978420: { nombre: 'Festival de Cannes', categoria: 'Mejor guion' },
  // --- BAFTA ---
  Q787131: { nombre: 'Premios BAFTA', categoria: 'Mejor dirección' },
  // --- Premios Goya ---
  Q1540553: { nombre: 'Premios Goya', categoria: 'Mejor dirección' },
  Q2634446: { nombre: 'Premios Goya', categoria: 'Mejor guion original' },
  // --- Premios Feroz ---
  Q15731591: { nombre: 'Premios Feroz', categoria: 'Mejor dirección' },
  // --- Medallas CEC (Círculo de Escritores Cinematográficos) ---
  Q27517873: { nombre: 'Medallas CEC', categoria: 'Mejor dirección' },
  // --- Premios del Cine Europeo ---
  Q777921: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor película' },
  Q1377755: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor dirección' },
  Q1377777: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor guion' },
  Q18535068: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor comedia' },
  Q3734888: { nombre: 'Premios del Cine Europeo', categoria: 'Descubrimiento europeo' },
  Q1377753: { nombre: 'Premios del Cine Europeo', categoria: 'Contribución al cine europeo' },
  // --- Festival de Berlín ---
  Q182836: { nombre: 'Festival de Berlín', categoria: 'Premio Teddy' },
  // --- Honores mayores de cine/artes ---
  Q727282: { nombre: 'Premios César', categoria: 'César de honor' },
  Q3319305: { nombre: 'Premio Princesa de Asturias', categoria: 'de las Artes' },
};

/**
 * Instituciones para las que también guardamos NOMINACIONES. Para el resto solo
 * cargamos lo ganado: una nominación al Óscar es notable, pero premios como el
 * del Cine Europeo nominan a los mismos autores casi todos los años y su ruido
 * tapa a los grandes. Todos los premios ganados se cargan siempre.
 */
const NOMINACIONES_RELEVANTES = new Set([
  'Premios Óscar',
  'Festival de Cannes',
  'Premios BAFTA',
  'Premios Goya',
]);

/**
 * Suplemento curado a mano para Lucrecia Martel: Wikidata no registra sus
 * premios de dirección ni en su ítem de persona ni en el de sus películas, así
 * que estos van cargados a mano (verificados). tmdbFilm linkea al catálogo.
 */
const MARTEL_MANUAL: {
  premio: { nombre: string; categoria: string };
  anio: number;
  ganador: boolean;
  tmdbFilm: number | null;
}[] = [
  // La ciénaga (2001) — tmdb 58429
  { premio: { nombre: 'Festival de Berlín', categoria: 'Premio Alfred Bauer' }, anio: 2001, ganador: true, tmdbFilm: 58429 },
  { premio: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor dirección' }, anio: 2002, ganador: true, tmdbFilm: 58429 },
  // Zama (2017) — tmdb 326382
  { premio: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor dirección' }, anio: 2018, ganador: true, tmdbFilm: 326382 },
];

type Entrada = {
  tmdbPersonId: number;
  premio: { nombre: string; categoria: string };
  anio: number;
  ganador: boolean;
  tmdbFilm: number | null;
};

async function querySparql(query: string): Promise<any[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { results: { bindings: any[] } };
  return json.results.bindings;
}

function qid(uri: string): string {
  return uri.split('/').pop() ?? uri;
}

/** Trae los premios a nivel persona de los 4 curados en una sola consulta. */
async function traerDeWikidata(): Promise<Entrada[]> {
  const values = CURADOS.map((c) => `wd:${c.qid}`).join(' ');
  const query = `
    SELECT ?person ?award ?type ?year ?tmdb WHERE {
      VALUES ?person { ${values} }
      {
        ?person p:P166 ?st . ?st ps:P166 ?award . BIND("ganado" AS ?type)
      } UNION {
        ?person p:P1411 ?st . ?st ps:P1411 ?award . BIND("nominado" AS ?type)
      }
      OPTIONAL { ?st pq:P585 ?date . }
      OPTIONAL { ?st pq:P1686 ?work . OPTIONAL { ?work wdt:P4947 ?tmdb . } }
      BIND(YEAR(?date) AS ?year)
    }`;

  const bindings = await querySparql(query);
  const porQid = new Map(CURADOS.map((c) => [c.qid, c.tmdbPersonId]));

  // Dedup por (persona, premio, año): un mismo galardón puede venir como
  // "ganado" y "nominado" el mismo año — nos quedamos con el ganado.
  const dedup = new Map<string, Entrada>();
  let sinMapear = 0;
  let sinAnio = 0;

  for (const b of bindings) {
    const awardQid = qid(b.award.value);
    const mapeo = AWARD_MAP[awardQid];
    if (!mapeo) {
      sinMapear++;
      continue;
    }
    const year = b.year?.value ? Number(b.year.value) : null;
    if (!year) {
      sinAnio++;
      continue;
    }
    const ganador = b.type.value === 'ganado';
    if (!ganador && !NOMINACIONES_RELEVANTES.has(mapeo.nombre)) continue;

    const tmdbPersonId = porQid.get(qid(b.person.value))!;
    const tmdbFilm = b.tmdb?.value ? Number(b.tmdb.value) : null;

    const key = `${tmdbPersonId}|${awardQid}|${year}`;
    const prev = dedup.get(key);
    if (!prev || (ganador && !prev.ganador)) {
      dedup.set(key, { tmdbPersonId, premio: mapeo, anio: year, ganador, tmdbFilm });
    }
  }

  console.log(`  Wikidata: ${bindings.length} filas → ${dedup.size} entradas (descartadas: ${sinMapear} sin mapear, ${sinAnio} sin año).`);
  return [...dedup.values()];
}

async function main() {
  console.log('Cargando premios de los 4 directores curados…\n');

  const entradas = await traerDeWikidata();
  for (const m of MARTEL_MANUAL) {
    entradas.push({ tmdbPersonId: 56208, premio: m.premio, anio: m.anio, ganador: m.ganador, tmdbFilm: m.tmdbFilm });
  }

  // Resolver personas (por tmdbId) y películas (por tmdbId) contra la DB.
  const personas = await prisma.persona.findMany({
    where: { tmdbId: { in: CURADOS.map((c) => c.tmdbPersonId) } },
    select: { id: true, tmdbId: true },
  });
  const personaPorTmdb = new Map(personas.map((p) => [p.tmdbId, p.id]));
  for (const c of CURADOS) {
    if (!personaPorTmdb.has(c.tmdbPersonId)) throw new Error(`Persona no encontrada en la DB: ${c.nombre} (tmdb ${c.tmdbPersonId})`);
  }

  const tmdbFilms = [...new Set(entradas.map((e) => e.tmdbFilm).filter((t): t is number => t !== null))];
  const peliculas = await prisma.pelicula.findMany({
    where: { tmdbId: { in: tmdbFilms } },
    select: { id: true, tmdbId: true },
  });
  const peliculaPorTmdb = new Map(peliculas.map((p) => [p.tmdbId, p.id]));

  const personaIds = [...personaPorTmdb.values()];

  await prisma.$transaction(
    async (tx) => {
      // Idempotencia: limpiar lo previo de estos 4 directores.
      await tx.premioGanado.deleteMany({ where: { personaId: { in: personaIds } } });

      // find-or-create de cada Premio distinto por (nombre, categoría).
      const premioCache = new Map<string, string>();
      for (const e of entradas) {
        const key = `${e.premio.nombre}||${e.premio.categoria}`;
        if (premioCache.has(key)) continue;
        const existente = await tx.premio.findFirst({
          where: { nombre: e.premio.nombre, categoria: e.premio.categoria },
          select: { id: true },
        });
        const id = existente?.id ?? (await tx.premio.create({ data: e.premio, select: { id: true } })).id;
        premioCache.set(key, id);
      }

      // Inserción en lote de todos los ganados/nominaciones.
      await tx.premioGanado.createMany({
        data: entradas.map((e) => ({
          premioId: premioCache.get(`${e.premio.nombre}||${e.premio.categoria}`)!,
          anio: e.anio,
          ganador: e.ganador,
          personaId: personaPorTmdb.get(e.tmdbPersonId)!,
          peliculaId: e.tmdbFilm ? peliculaPorTmdb.get(e.tmdbFilm) ?? null : null,
        })),
      });

      // Limpiar Premios que quedaron sin ningún ganado (mapeos retirados, etc.).
      await tx.premio.deleteMany({ where: { ganados: { none: {} } } });
    },
    { timeout: 30000, maxWait: 10000 }
  );

  // Resumen por director.
  console.log('\nCargado:');
  for (const c of CURADOS) {
    const personaId = personaPorTmdb.get(c.tmdbPersonId)!;
    const total = await prisma.premioGanado.count({ where: { personaId } });
    const ganados = await prisma.premioGanado.count({ where: { personaId, ganador: true } });
    console.log(`  ${c.nombre}: ${total} (${ganados} ganados, ${total - ganados} nominaciones)`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
