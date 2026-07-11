import Link from 'next/link';
import type { Metadata } from 'next';
import { getPeliculas, getFacetas } from '@/lib/api/peliculas';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';

export const metadata: Metadata = { title: 'Explorar' };

const DURACIONES = [
  { valor: 'corta', label: 'Corta · menos de 90 min' },
  { valor: 'media', label: 'Media · 90 a 140 min' },
  { valor: 'larga', label: 'Larga · más de 140 min' },
];

const ORDENES = [
  { valor: 'estreno_desc', label: 'Estreno · más nuevo' },
  { valor: 'estreno_asc', label: 'Estreno · más antiguo' },
  { valor: 'duracion_desc', label: 'Duración · más larga' },
  { valor: 'duracion_asc', label: 'Duración · más corta' },
  { valor: 'titulo_asc', label: 'Título · A–Z' },
];

const ORDEN_DEFAULT = 'estreno_desc';

type Params = {
  genero?: string;
  decada?: string;
  duracion?: string;
  orden?: string;
  pagina?: string;
};

type Props = { searchParams: Promise<Params> };

/** Décadas disponibles según el rango de años del catálogo, de la más nueva a la más vieja. */
function decadasDisponibles(anioMin: number | null, anioMax: number | null): number[] {
  if (anioMin == null || anioMax == null) return [];
  const desde = Math.floor(anioMin / 10) * 10;
  const hasta = Math.floor(anioMax / 10) * 10;
  const decadas: number[] = [];
  for (let d = hasta; d >= desde; d -= 10) decadas.push(d);
  return decadas;
}

/** URL de /explorar preservando los filtros activos (para la paginación). */
function urlCon(actual: Params, cambios: Partial<Params>): string {
  const merged = { ...actual, ...cambios };
  const qs = new URLSearchParams();
  if (merged.genero) qs.set('genero', merged.genero);
  if (merged.decada) qs.set('decada', merged.decada);
  if (merged.duracion) qs.set('duracion', merged.duracion);
  if (merged.orden && merged.orden !== ORDEN_DEFAULT) qs.set('orden', merged.orden);
  if (merged.pagina && Number(merged.pagina) > 1) qs.set('pagina', merged.pagina);
  const s = qs.toString();
  return s ? `/explorar?${s}` : '/explorar';
}

const claseSelect =
  'w-full rounded-sm border border-borde bg-carbon px-3 py-2 font-mono text-xs text-papel ' +
  'transition-colors hover:border-papel/40 focus-visible:border-marca-cambio focus-visible:outline-none';

const claseLabel = 'block font-mono text-[0.65rem] uppercase tracking-[0.2em] text-papel/40';

export default async function PaginaExplorar({ searchParams }: Props) {
  const params = await searchParams;
  const { genero, decada, duracion, orden, pagina } = params;
  const numeroPagina = Math.max(1, Number(pagina) || 1);
  const ordenActivo = orden ?? ORDEN_DEFAULT;

  const [facetas, listado] = await Promise.all([
    getFacetas(),
    getPeliculas({
      genero,
      decada: decada ? Number(decada) : undefined,
      duracion,
      orden: ordenActivo,
      pagina: numeroPagina,
    }),
  ]);

  const decadas = decadasDisponibles(facetas.anioMin, facetas.anioMax);
  const hayFiltros = Boolean(genero || decada || duracion || (orden && orden !== ORDEN_DEFAULT));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Explorar</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">El catálogo</h1>

      {/* Filtros: form GET nativo, sin JS. Al enviar se descarta `pagina` y vuelve a la 1. */}
      <form method="get" action="/explorar" className="mt-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="genero" className={claseLabel}>
              Género
            </label>
            <select id="genero" name="genero" defaultValue={genero ?? ''} className={`mt-2 ${claseSelect}`}>
              <option value="">Todos</option>
              {facetas.generos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="decada" className={claseLabel}>
              Década
            </label>
            <select id="decada" name="decada" defaultValue={decada ?? ''} className={`mt-2 ${claseSelect}`}>
              <option value="">Todas</option>
              {decadas.map((d) => (
                <option key={d} value={d}>
                  Los {String(d).slice(2)} · {d}–{d + 9}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duracion" className={claseLabel}>
              Duración
            </label>
            <select id="duracion" name="duracion" defaultValue={duracion ?? ''} className={`mt-2 ${claseSelect}`}>
              <option value="">Cualquiera</option>
              {DURACIONES.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="orden" className={claseLabel}>
              Ordenar por
            </label>
            <select id="orden" name="orden" defaultValue={ordenActivo} className={`mt-2 ${claseSelect}`}>
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-sm border border-marca-cambio bg-marca-cambio/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.15em] text-marca-cambio transition-colors hover:bg-marca-cambio/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-marca-cambio"
          >
            Aplicar
          </button>
          {hayFiltros && (
            <Link href="/explorar" className="font-mono text-xs text-papel/50 hover:text-papel">
              Limpiar
            </Link>
          )}
        </div>
      </form>

      <p className="mt-8 font-mono text-xs text-papel/40">
        {listado.total} película{listado.total === 1 ? '' : 's'}
      </p>

      {listado.items.length === 0 ? (
        <p className="mt-12 text-papel/60">No hay películas con esos filtros.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {listado.items.map((p, i) => (
            // La primera fila (hasta 5 en desktop) entra sin scrollear.
            <PosterCard key={p.id} pelicula={p} prioridad={i < 5} />
          ))}
        </div>
      )}

      {listado.totalPaginas > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-4 font-mono text-sm">
          {numeroPagina > 1 && (
            <Link
              href={urlCon(params, { pagina: String(numeroPagina - 1) })}
              className="text-papel/60 hover:text-papel"
            >
              ← anterior
            </Link>
          )}
          <span className="text-papel/40">
            {numeroPagina} / {listado.totalPaginas}
          </span>
          {numeroPagina < listado.totalPaginas && (
            <Link
              href={urlCon(params, { pagina: String(numeroPagina + 1) })}
              className="text-papel/60 hover:text-papel"
            >
              siguiente →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
