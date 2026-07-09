import { prisma } from '../src/config/prisma';

/**
 * Carga de premios reales desde Wikidata vía SPARQL (gratis, sin API key)
 * para las personas con presencia real en el catálogo: directores y actores
 * con al menos MIN_CREDITOS créditos. Proceso puntual/manual — NO corre en
 * el cron.
 *
 *   npm run seed:premios              (backend/) — carga completa
 *   npm run seed:premios -- --dry-run — solo vuelca los premios distintos
 *                                       encontrados (para curar AWARD_MAP)
 *
 * Cómo funciona:
 * 1. Resuelve la entidad de Wikidata de cada persona por su TMDB id
 *    (propiedad P4985) — sin riesgo de homónimos, sin curar QIDs a mano.
 * 2. Trae los premios registrados a nivel PERSONA (P166 "premio recibido" y
 *    P1411 "nominado a"), con año (P585) y obra (P1686). Esto atribuye cada
 *    premio a la persona — a diferencia de mirar los premios de la película,
 *    que mezclaría galardones de otros rubros.
 * 3. Cada premio pasa por AWARD_MAP (QID → nombre + categoría): funciona a la
 *    vez como allowlist (los no mapeados se descartan — honores civiles,
 *    doctorados, premios menores) y como normalización de nombres al español.
 *
 * Idempotente: borra los PremioGanado de las personas procesadas y reinserta;
 * reusa filas de Premio (find-or-create por nombre+categoría) y limpia
 * huérfanos.
 */

const USER_AGENT = 'Raccord/1.0 (portfolio cine de autor; rosatomas.contact@gmail.com)';
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const MIN_CREDITOS = 2;
const BATCH_QID = 200; // tmdbIds por consulta de resolución
const BATCH_PREMIOS = 80; // personas por consulta de premios
const PAUSA_MS = 1000; // pausa entre consultas (cortesía con WDQS)

const dryRun = process.argv.includes('--dry-run');

/**
 * QID de premio (Wikidata) → cómo lo mostramos. Solo los premios acá listados
 * se cargan; el resto se descarta. Curado a mano a partir del volcado real
 * (--dry-run) sobre las ~680 personas del catálogo.
 */
const AWARD_MAP: Record<string, { nombre: string; categoria: string }> = {
  // --- Premios Óscar ---
  Q102427: { nombre: 'Premios Óscar', categoria: 'Mejor película' },
  Q106800: { nombre: 'Premios Óscar', categoria: 'Mejor película de animación' },
  Q105304: { nombre: 'Premios Óscar', categoria: 'Mejor película internacional' },
  Q1324407: { nombre: 'Premios Óscar', categoria: 'Mejor cortometraje' },
  Q103360: { nombre: 'Premios Óscar', categoria: 'Mejor dirección' },
  Q41417: { nombre: 'Premios Óscar', categoria: 'Mejor guion original' },
  Q107258: { nombre: 'Premios Óscar', categoria: 'Mejor guion adaptado' },
  Q103916: { nombre: 'Premios Óscar', categoria: 'Mejor actor' },
  Q103618: { nombre: 'Premios Óscar', categoria: 'Mejor actriz' },
  Q106291: { nombre: 'Premios Óscar', categoria: 'Mejor actor de reparto' },
  Q106301: { nombre: 'Premios Óscar', categoria: 'Mejor actriz de reparto' },
  Q727328: { nombre: 'Premios Óscar', categoria: 'Óscar honorífico' },
  // --- Festival de Cannes ---
  Q179808: { nombre: 'Festival de Cannes', categoria: 'Palma de Oro' },
  Q510175: { nombre: 'Festival de Cannes', categoria: 'Mejor dirección' },
  Q978420: { nombre: 'Festival de Cannes', categoria: 'Mejor guion' },
  Q844804: { nombre: 'Festival de Cannes', categoria: 'Gran Premio del Jurado' },
  Q586140: { nombre: 'Festival de Cannes', categoria: 'Mejor actor' },
  Q840286: { nombre: 'Festival de Cannes', categoria: 'Mejor actriz' },
  // --- Festival de Venecia ---
  Q209459: { nombre: 'Festival de Venecia', categoria: 'León de Oro' },
  Q3241784: { nombre: 'Festival de Venecia', categoria: 'León de Oro por la carrera' },
  Q1337827: { nombre: 'Festival de Venecia', categoria: 'León de Plata a la dirección' },
  Q2089923: { nombre: 'Festival de Venecia', categoria: 'Copa Volpi al mejor actor' },
  Q2089918: { nombre: 'Festival de Venecia', categoria: 'Copa Volpi a la mejor actriz' },
  // --- Festival de Berlín ---
  Q154590: { nombre: 'Festival de Berlín', categoria: 'Oso de Oro' },
  Q287062: { nombre: 'Festival de Berlín', categoria: 'Oso de Oro honorífico' },
  Q708135: { nombre: 'Festival de Berlín', categoria: 'Oso de Plata' },
  Q706031: { nombre: 'Festival de Berlín', categoria: 'Oso de Plata a la dirección' },
  Q819973: { nombre: 'Festival de Berlín', categoria: 'Oso de Plata al mejor actor' },
  Q376834: { nombre: 'Festival de Berlín', categoria: 'Oso de Plata a la mejor actriz' },
  Q182836: { nombre: 'Festival de Berlín', categoria: 'Premio Teddy' },
  // --- Festival de San Sebastián (foco hispano) ---
  Q775086: { nombre: 'Festival de San Sebastián', categoria: 'Concha de Oro' },
  Q610136: { nombre: 'Festival de San Sebastián', categoria: 'Concha de Plata al mejor actor' },
  Q610152: { nombre: 'Festival de San Sebastián', categoria: 'Concha de Plata a la mejor actriz' },
  Q908858: { nombre: 'Festival de San Sebastián', categoria: 'Premio Donostia' },
  // --- BAFTA ---
  Q787131: { nombre: 'Premios BAFTA', categoria: 'Mejor dirección' },
  Q139184: { nombre: 'Premios BAFTA', categoria: 'Mejor película' },
  Q41375: { nombre: 'Premios BAFTA', categoria: 'Mejor guion original' },
  Q400007: { nombre: 'Premios BAFTA', categoria: 'Mejor actor' },
  Q687123: { nombre: 'Premios BAFTA', categoria: 'Mejor actriz' },
  Q548389: { nombre: 'Premios BAFTA', categoria: 'Mejor actor de reparto' },
  Q787123: { nombre: 'Premios BAFTA', categoria: 'Mejor actriz de reparto' },
  // --- Globos de Oro ---
  Q586356: { nombre: 'Globos de Oro', categoria: 'Mejor dirección' },
  Q849124: { nombre: 'Globos de Oro', categoria: 'Mejor guion' },
  Q593098: { nombre: 'Globos de Oro', categoria: 'Mejor actor — drama' },
  Q181883: { nombre: 'Globos de Oro', categoria: 'Mejor actor — comedia o musical' },
  Q463085: { nombre: 'Globos de Oro', categoria: 'Mejor actriz — drama' },
  Q1011564: { nombre: 'Globos de Oro', categoria: 'Mejor actriz — comedia o musical' },
  Q723830: { nombre: 'Globos de Oro', categoria: 'Mejor actor de reparto' },
  Q822907: { nombre: 'Globos de Oro', categoria: 'Mejor actriz de reparto' },
  Q640353: { nombre: 'Globos de Oro', categoria: 'Premio Cecil B. DeMille' },
  // --- Premios Goya ---
  Q1540553: { nombre: 'Premios Goya', categoria: 'Mejor dirección' },
  Q2634446: { nombre: 'Premios Goya', categoria: 'Mejor guion original' },
  Q1520004: { nombre: 'Premios Goya', categoria: 'Mejor actor protagonista' },
  Q1379415: { nombre: 'Premios Goya', categoria: 'Mejor actriz protagonista' },
  Q1367639: { nombre: 'Premios Goya', categoria: 'Mejor actor de reparto' },
  Q429700: { nombre: 'Premios Goya', categoria: 'Mejor actriz de reparto' },
  // --- Premios César ---
  Q727282: { nombre: 'Premios César', categoria: 'César de honor' },
  Q24137: { nombre: 'Premios César', categoria: 'Mejor dirección' },
  Q900494: { nombre: 'Premios César', categoria: 'Mejor actor' },
  Q24241: { nombre: 'Premios César', categoria: 'Mejor actriz' },
  // --- Premios del Sindicato de Actores (SAG) ---
  Q654620: { nombre: 'Premios SAG', categoria: 'Mejor actor protagonista' },
  Q1260789: { nombre: 'Premios SAG', categoria: 'Mejor actor de reparto' },
  Q518675: { nombre: 'Premios SAG', categoria: 'Mejor reparto' },
  // --- Premios Cóndor de Plata (Argentina) ---
  Q6359055: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor actor' },
  Q16965854: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor actor de reparto' },
  // --- Premios del Cine Europeo ---
  Q777921: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor película' },
  Q1377755: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor dirección' },
  Q1377777: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor guion' },
  Q932281: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor actor' },
  Q1377738: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor actriz' },
  Q1377772: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor película no europea' },
  Q18535068: { nombre: 'Premios del Cine Europeo', categoria: 'Mejor comedia' },
  Q3734888: { nombre: 'Premios del Cine Europeo', categoria: 'Descubrimiento europeo' },
  Q1377753: { nombre: 'Premios del Cine Europeo', categoria: 'Contribución al cine europeo' },
  // --- Otros mayores ---
  Q3319305: { nombre: 'Premio Princesa de Asturias', categoria: 'de las Artes' },
  Q15731591: { nombre: 'Premios Feroz', categoria: 'Mejor dirección' },
  Q27517873: { nombre: 'Medallas CEC', categoria: 'Mejor dirección' },
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
  'Globos de Oro',
]);

/**
 * Suplemento curado a mano para Lucrecia Martel: Wikidata no registra sus
 * premios de dirección ni en su ítem de persona ni en el de sus películas.
 * tmdbFilm linkea al catálogo. (tmdbPerson 56208)
 */
const MARTEL_MANUAL: {
  premio: { nombre: string; categoria: string };
  anio: number;
  ganador: boolean;
  tmdbFilm: number | null;
}[] = [
  { premio: { nombre: 'Festival de Berlín', categoria: 'Premio Alfred Bauer' }, anio: 2001, ganador: true, tmdbFilm: 58429 },
  { premio: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor dirección' }, anio: 2002, ganador: true, tmdbFilm: 58429 },
  { premio: { nombre: 'Premios Cóndor de Plata', categoria: 'Mejor dirección' }, anio: 2018, ganador: true, tmdbFilm: 326382 },
];
const MARTEL_TMDB = 56208;

type Entrada = {
  tmdbPersonId: number;
  premio: { nombre: string; categoria: string };
  anio: number;
  ganador: boolean;
  tmdbFilm: number | null;
};

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function querySparql(query: string): Promise<any[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { results: { bindings: any[] } };
  return json.results.bindings;
}

const qidDe = (uri: string): string => uri.split('/').pop() ?? uri;

function lotes<T>(items: T[], tamano: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) out.push(items.slice(i, i + tamano));
  return out;
}

/** Personas objetivo: directores y actores con >= MIN_CREDITOS créditos en ese rol. */
async function personasObjetivo() {
  const porRol = async (rol: 'DIRECTOR' | 'ACTOR') => {
    const grupos = await prisma.creditoPelicula.groupBy({
      by: ['personaId'],
      where: { rol },
      _count: { peliculaId: true },
      having: { peliculaId: { _count: { gte: MIN_CREDITOS } } },
    });
    return grupos.map((g) => g.personaId);
  };
  const ids = [...new Set([...(await porRol('DIRECTOR')), ...(await porRol('ACTOR'))])];
  const personas = await prisma.persona.findMany({
    where: { id: { in: ids }, tmdbId: { not: null } },
    select: { id: true, tmdbId: true, nombre: true },
  });
  return personas as { id: string; tmdbId: number; nombre: string }[];
}

/** tmdbId → QID de Wikidata, resuelto por P4985 en lotes. */
async function resolverQids(tmdbIds: number[]): Promise<Map<number, string>> {
  const mapa = new Map<number, string>();
  for (const lote of lotes(tmdbIds, BATCH_QID)) {
    const values = lote.map((id) => `"${id}"`).join(' ');
    const rows = await querySparql(`
      SELECT ?person ?tmdb WHERE {
        VALUES ?tmdb { ${values} }
        ?person wdt:P4985 ?tmdb .
      }`);
    for (const r of rows) mapa.set(Number(r.tmdb.value), qidDe(r.person.value));
    await pausa(PAUSA_MS);
  }
  return mapa;
}

/** Premios a nivel persona (P166/P1411) para un conjunto de QIDs, en lotes. */
async function traerPremios(qidPorTmdb: Map<number, string>) {
  const tmdbPorQid = new Map([...qidPorTmdb.entries()].map(([t, q]) => [q, t]));
  const filas: any[] = [];
  for (const lote of lotes([...tmdbPorQid.keys()], BATCH_PREMIOS)) {
    const values = lote.map((q) => `wd:${q}`).join(' ');
    const rows = await querySparql(`
      SELECT ?person ?award ?awardLabel ?type ?year ?tmdbFilm WHERE {
        VALUES ?person { ${values} }
        {
          ?person p:P166 ?st . ?st ps:P166 ?award . BIND("ganado" AS ?type)
        } UNION {
          ?person p:P1411 ?st . ?st ps:P1411 ?award . BIND("nominado" AS ?type)
        }
        OPTIONAL { ?st pq:P585 ?date . }
        OPTIONAL { ?st pq:P1686 ?work . OPTIONAL { ?work wdt:P4947 ?tmdbFilm . } }
        BIND(YEAR(?date) AS ?year)
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
      }`);
    filas.push(...rows);
    await pausa(PAUSA_MS);
  }
  return { filas, tmdbPorQid };
}

async function main() {
  console.log(`Cargando premios (directores y actores con >=${MIN_CREDITOS} créditos)…\n`);

  const personas = await personasObjetivo();
  console.log(`Personas objetivo: ${personas.length}`);

  const qidPorTmdb = await resolverQids(personas.map((p) => p.tmdbId));
  console.log(`Con entidad en Wikidata (P4985): ${qidPorTmdb.size}`);

  const { filas, tmdbPorQid } = await traerPremios(qidPorTmdb);
  console.log(`Filas de premios crudas: ${filas.length}`);

  if (dryRun) {
    // Volcado de premios distintos para curar AWARD_MAP: QID, etiqueta,
    // cuántas veces aparece y si ya está mapeado.
    const conteo = new Map<string, { label: string; n: number }>();
    for (const r of filas) {
      const q = qidDe(r.award.value);
      const prev = conteo.get(q);
      if (prev) prev.n++;
      else conteo.set(q, { label: r.awardLabel?.value ?? q, n: 1 });
    }
    console.log(`\nPremios distintos: ${conteo.size}\n`);
    for (const [q, { label, n }] of [...conteo.entries()].sort((a, b) => b[1].n - a[1].n)) {
      console.log(`${AWARD_MAP[q] ? 'MAP' : '   '} ${String(n).padStart(4)}  ${q}  ${label}`);
    }
    return;
  }

  // Filtrado + dedupe por (persona, premio, año): un mismo galardón puede
  // venir como "ganado" y "nominado" el mismo año — gana el ganado.
  const dedup = new Map<string, Entrada>();
  let sinMapear = 0;
  let sinAnio = 0;
  for (const r of filas) {
    const awardQid = qidDe(r.award.value);
    const mapeo = AWARD_MAP[awardQid];
    if (!mapeo) {
      sinMapear++;
      continue;
    }
    const anio = r.year?.value ? Number(r.year.value) : null;
    if (!anio) {
      sinAnio++;
      continue;
    }
    const ganador = r.type.value === 'ganado';
    if (!ganador && !NOMINACIONES_RELEVANTES.has(mapeo.nombre)) continue;

    const tmdbPersonId = tmdbPorQid.get(qidDe(r.person.value))!;
    const tmdbFilm = r.tmdbFilm?.value ? Number(r.tmdbFilm.value) : null;
    const key = `${tmdbPersonId}|${awardQid}|${anio}`;
    const prev = dedup.get(key);
    if (!prev || (ganador && !prev.ganador)) {
      dedup.set(key, { tmdbPersonId, premio: mapeo, anio, ganador, tmdbFilm });
    }
  }
  const entradas = [...dedup.values()];
  for (const m of MARTEL_MANUAL) {
    entradas.push({ tmdbPersonId: MARTEL_TMDB, ...m });
  }
  console.log(`Entradas a cargar: ${entradas.length} (descartadas: ${sinMapear} sin mapear, ${sinAnio} sin año)`);

  // Resolver referencias contra la DB.
  const personaPorTmdb = new Map(personas.map((p) => [p.tmdbId, p.id]));
  const tmdbFilms = [...new Set(entradas.map((e) => e.tmdbFilm).filter((t): t is number => t !== null))];
  const peliculas = await prisma.pelicula.findMany({
    where: { tmdbId: { in: tmdbFilms } },
    select: { id: true, tmdbId: true },
  });
  const peliculaPorTmdb = new Map(peliculas.map((p) => [p.tmdbId, p.id]));

  await prisma.$transaction(
    async (tx) => {
      // Idempotencia: limpiar lo previo de todas las personas objetivo.
      await tx.premioGanado.deleteMany({
        where: { personaId: { in: personas.map((p) => p.id) } },
      });

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
    { timeout: 60000, maxWait: 10000 }
  );

  // Resumen.
  const personasConPremios = await prisma.premioGanado.groupBy({
    by: ['personaId'],
    where: { personaId: { in: personas.map((p) => p.id) } },
  });
  const totalFilas = await prisma.premioGanado.count();
  console.log(`\nCargado: ${personasConPremios.length} personas con premios, ${totalFilas} filas en PremioGanado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
