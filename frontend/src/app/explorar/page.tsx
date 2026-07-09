import Link from 'next/link';
import type { Metadata } from 'next';
import { getPeliculas } from '@/lib/api/peliculas';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = { title: 'Explorar' };

const GENEROS_DESTACADOS = [
  'Drama',
  'Comedia',
  'Suspense',
  'Ciencia ficción',
  'Documental',
  'Animación',
  'Crimen',
  'Romance',
];

type Props = {
  searchParams: Promise<{ genero?: string; anio?: string; pagina?: string }>;
};

function urlCon(params: { genero?: string; anio?: string; pagina?: number }) {
  const qs = new URLSearchParams();
  if (params.genero) qs.set('genero', params.genero);
  if (params.anio) qs.set('anio', params.anio);
  if (params.pagina && params.pagina > 1) qs.set('pagina', String(params.pagina));
  const s = qs.toString();
  return s ? `/explorar?${s}` : '/explorar';
}

export default async function PaginaExplorar({ searchParams }: Props) {
  const { genero, anio, pagina } = await searchParams;
  const numeroPagina = Math.max(1, Number(pagina) || 1);

  const listado = await getPeliculas({
    genero,
    anio: anio ? Number(anio) : undefined,
    pagina: numeroPagina,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Explorar</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">El catálogo</h1>

      {/* Filtros por género: links, sin JS. */}
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href={urlCon({ anio })}
          className={cn(
            'rounded-sm border px-3 py-1 font-mono text-xs transition-colors',
            !genero
              ? 'border-marca-cambio text-marca-cambio'
              : 'border-borde text-papel/60 hover:text-papel'
          )}
        >
          Todos
        </Link>
        {GENEROS_DESTACADOS.map((g) => (
          <Link
            key={g}
            href={urlCon({ genero: g, anio })}
            className={cn(
              'rounded-sm border px-3 py-1 font-mono text-xs transition-colors',
              genero?.toLowerCase() === g.toLowerCase()
                ? 'border-marca-cambio text-marca-cambio'
                : 'border-borde text-papel/60 hover:text-papel'
            )}
          >
            {g}
          </Link>
        ))}
      </div>

      <p className="mt-6 font-mono text-xs text-papel/40">
        {listado.total} película{listado.total === 1 ? '' : 's'}
        {genero ? ` · ${genero}` : ''}
        {anio ? ` · ${anio}` : ''}
      </p>

      {listado.items.length === 0 ? (
        <p className="mt-12 text-papel/60">No hay películas con esos filtros.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
              href={urlCon({ genero, anio, pagina: numeroPagina - 1 })}
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
              href={urlCon({ genero, anio, pagina: numeroPagina + 1 })}
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
