import { prisma } from '../src/config/prisma';

/**
 * Rellena biografías de directores en español desde Wikipedia. TMDB no tiene
 * bio en español para muchos directores y el cliente cae a inglés a propósito
 * (mejor que vacío), pero eso deja fichas mitad en inglés. Este job las repara
 * con la introducción del artículo de Wikipedia en español, misma filosofía de
 * fuente que los premios (Wikidata/Wikipedia, real y gratis).
 *
 *   npm run seed:biografias              (backend/) — carga completa
 *   npm run seed:biografias -- --dry-run — lista qué cambiaría, sin escribir
 *
 * Cómo funciona:
 * 1. Toma los directores con >= MIN_CREDITOS créditos de dirección cuya bio
 *    está vacía o parece estar en inglés (heurística de marcadores).
 * 2. Resuelve el artículo de Wikipedia en español de cada uno vía Wikidata
 *    (propiedad P4985 = TMDB id → entidad → sitelink eswiki). Sin curar QIDs.
 * 3. Trae la introducción (lead section) del artículo y la guarda, recortada a
 *    un largo razonable en un límite de párrafo/frase.
 *
 * Idempotente: solo pisa bios vacías o en inglés, y solo cuando encontró un
 * artículo en español — nunca borra una bio en español ya existente.
 */

const USER_AGENT = 'Raccord/1.0 (portfolio cine de autor; rosatomas.contact@gmail.com)';
const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const WIKI_API = 'https://es.wikipedia.org/w/api.php';
const MIN_CREDITOS = 2;
const BATCH_QID = 150; // tmdbIds por consulta SPARQL
const PAUSA_MS = 300; // cortesía entre requests
const MAX_LARGO = 1800; // recorte de la intro para no inflar la ficha

const dryRun = process.argv.includes('--dry-run');
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Heurística de idioma: cuenta marcadores muy frecuentes de cada lengua. No
 * pretende ser perfecta — solo decide si vale la pena buscar reemplazo. Un
 * falso positivo termina reemplazando una bio en español por otra en español
 * (inofensivo); un falso negativo deja la bio en inglés (se puede reiterar).
 */
function pareceIngles(bio: string): boolean {
  const t = ' ' + bio.toLowerCase() + ' ';
  const en = [' the ', ' and ', ' was ', ' is ', ' of the ', ' his ', ' her ', ' which ', ' born ', ' films ', ' known for '];
  const es = [' el ', ' la ', ' los ', ' las ', ' de ', ' del ', ' que ', ' fue ', ' es ', ' su ', ' película', ' director de ', ' nació '];
  const puntaje = (marcas: string[]) => marcas.filter((m) => t.includes(m)).length;
  return puntaje(en) > puntaje(es);
}

function lotes<T>(items: T[], tamano: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += tamano) out.push(items.slice(i, i + tamano));
  return out;
}

async function querySparql(query: string): Promise<any[]> {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`SPARQL ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = (await res.json()) as { results: { bindings: any[] } };
  return json.results.bindings;
}

/** Directores con >= MIN_CREDITOS créditos de dirección y su bio actual. */
async function directoresObjetivo() {
  const grupos = await prisma.creditoPelicula.groupBy({
    by: ['personaId'],
    where: { rol: 'DIRECTOR' },
    _count: { peliculaId: true },
    having: { peliculaId: { _count: { gte: MIN_CREDITOS } } },
  });
  const personas = await prisma.persona.findMany({
    where: { id: { in: grupos.map((g) => g.personaId) }, tmdbId: { not: null } },
    select: { id: true, tmdbId: true, nombre: true, biografia: true },
  });
  return personas as { id: string; tmdbId: number; nombre: string; biografia: string | null }[];
}

/** tmdbId → título del artículo de Wikipedia en español, resuelto por P4985. */
async function resolverArticulos(tmdbIds: number[]): Promise<Map<number, string>> {
  const mapa = new Map<number, string>();
  for (const lote of lotes(tmdbIds, BATCH_QID)) {
    const values = lote.map((id) => `"${id}"`).join(' ');
    const rows = await querySparql(`
      SELECT ?tmdb ?article WHERE {
        VALUES ?tmdb { ${values} }
        ?person wdt:P4985 ?tmdb .
        ?article schema:about ?person ;
                 schema:isPartOf <https://es.wikipedia.org/> .
      }`);
    for (const r of rows) {
      const titulo = decodeURIComponent((r.article.value as string).split('/wiki/').pop() ?? '').replace(/_/g, ' ');
      if (titulo) mapa.set(Number(r.tmdb.value), titulo);
    }
    await pausa(PAUSA_MS);
  }
  return mapa;
}

/** Introducción (lead section) del artículo de Wikipedia en español. */
async function traerIntro(titulo: string): Promise<string | null> {
  const url = new URL(WIKI_API);
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    redirects: '1',
    titles: titulo,
  }).toString();

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const json = (await res.json()) as { query?: { pages?: Record<string, { extract?: string }> } };
  const page = Object.values(json.query?.pages ?? {})[0];
  const extract = page?.extract?.trim();
  return extract && extract.length > 0 ? extract : null;
}

/** Recorta a MAX_LARGO cortando en el último párrafo/frase para no dejar frases colgadas. */
function recortar(texto: string): string {
  if (texto.length <= MAX_LARGO) return texto;
  const corte = texto.slice(0, MAX_LARGO);
  const finParrafo = corte.lastIndexOf('\n');
  const finFrase = corte.lastIndexOf('. ');
  const idx = Math.max(finParrafo, finFrase);
  return (idx > MAX_LARGO * 0.5 ? corte.slice(0, idx + 1) : corte).trim();
}

async function main() {
  console.log(`Biografías en español (directores con >=${MIN_CREDITOS} créditos)${dryRun ? ' — DRY RUN' : ''}\n`);

  const directores = await directoresObjetivo();
  const objetivo = directores.filter((d) => !d.biografia || pareceIngles(d.biografia));
  console.log(`Directores con bio vacía o en inglés: ${objetivo.length} de ${directores.length}\n`);

  const articulos = await resolverArticulos(objetivo.map((d) => d.tmdbId));

  let actualizados = 0;
  let sinArticulo = 0;
  let sinIntro = 0;

  for (const dir of objetivo) {
    const titulo = articulos.get(dir.tmdbId);
    if (!titulo) {
      sinArticulo++;
      console.log(`  ○ ${dir.nombre}: sin artículo en Wikipedia en español`);
      continue;
    }

    const intro = await traerIntro(titulo);
    await pausa(PAUSA_MS);
    if (!intro) {
      sinIntro++;
      console.log(`  ○ ${dir.nombre}: "${titulo}" sin introducción`);
      continue;
    }

    const bio = recortar(intro);
    if (dryRun) {
      console.log(`  ✎ ${dir.nombre} ← "${titulo}" (${bio.length} car.): ${bio.slice(0, 90)}…`);
    } else {
      await prisma.persona.update({ where: { id: dir.id }, data: { biografia: bio } });
      console.log(`  ✓ ${dir.nombre} ← "${titulo}" (${bio.length} car.)`);
    }
    actualizados++;
  }

  console.log(
    `\n${dryRun ? 'Se actualizarían' : 'Actualizados'}: ${actualizados}. ` +
      `Sin artículo es.wiki: ${sinArticulo}. Sin introducción: ${sinIntro}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
