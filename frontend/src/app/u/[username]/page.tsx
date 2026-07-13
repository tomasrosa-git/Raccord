import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPerfilPublico } from '@/lib/api/panteon';
import { ApiError } from '@/lib/api/client';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import type { PerfilPublico, EntradaPanteon } from '@/types';

export const revalidate = 60;

type Props = { params: Promise<{ username: string }> };

async function buscarPerfil(username: string): Promise<PerfilPublico | null> {
  try {
    return await getPerfilPublico(username);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const perfil = await buscarPerfil(username);
  if (!perfil) return {};
  return {
    title: `@${perfil.usuario.username}`,
    description: `El panteón de directores de @${perfil.usuario.username} en Raccord.`,
  };
}

function TarjetaPanteon({ entrada, orden }: { entrada: EntradaPanteon; orden: number }) {
  return (
    <div className="flex flex-col border border-borde bg-negro-sala p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-marca-cambio">
          {String(orden).padStart(2, '0')}
        </span>
        <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-full bg-carbon">
          {entrada.persona.fotoUrl && (
            <Image
              src={entrada.persona.fotoUrl}
              alt={entrada.persona.nombre}
              fill
              sizes="48px"
              className="object-cover"
            />
          )}
        </div>
        <Link
          href={`/cineasta/${entrada.persona.id}`}
          className="font-display text-lg leading-snug text-papel/90 hover:text-papel"
        >
          {entrada.persona.nombre}
        </Link>
      </div>

      {entrada.progreso.total > 0 && (
        <p className="mt-3 font-mono text-xs text-papel/40">
          {entrada.progreso.vistas === entrada.progreso.total ? (
            <span className="text-marca-cambio">★ Completista</span>
          ) : (
            <>
              Vio {entrada.progreso.vistas} de {entrada.progreso.total} películas
            </>
          )}
        </p>
      )}

      {entrada.pelicula ? (
        <Link
          href={`/pelicula/${entrada.pelicula.id}`}
          className="group mt-4 flex items-center gap-3 border-t border-borde pt-4"
        >
          <div className="relative h-16 w-11 shrink-0 overflow-hidden bg-carbon">
            {entrada.pelicula.posterUrl && (
              <Image
                src={entrada.pelicula.posterUrl}
                alt={`Póster de ${entrada.pelicula.titulo}`}
                fill
                sizes="44px"
                className="object-cover transition-opacity group-hover:opacity-80"
              />
            )}
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-papel/40">
              Su favorita
            </p>
            <p className="mt-1 text-sm text-papel/90 group-hover:text-papel">
              {entrada.pelicula.titulo}
            </p>
          </div>
        </Link>
      ) : (
        <p className="mt-4 border-t border-borde pt-4 font-mono text-xs text-papel/30">
          Sin película favorita elegida
        </p>
      )}
    </div>
  );
}

export default async function PerfilPublicoPage({ params }: Props) {
  const { username } = await params;
  const perfil = await buscarPerfil(username);
  if (!perfil) notFound();

  const { usuario, panteon, stats } = perfil;
  const miembroDesde = new Date(usuario.createdAt).toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  const numeros = [
    { valor: stats.reviewsPersona, label: 'reseñas de directores' },
    { valor: stats.reviews, label: 'reseñas de películas' },
    { valor: stats.siguiendo, label: 'directores seguidos' },
    { valor: stats.likes, label: 'me gusta' },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-carbon">
          {usuario.avatarUrl && (
            <Image src={usuario.avatarUrl} alt="" fill sizes="96px" className="object-cover" />
          )}
        </div>
        <div>
          <EtiquetaSeccion>Perfil</EtiquetaSeccion>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">@{usuario.username}</h1>
          <p className="mt-2 font-mono text-xs text-papel/40">En Raccord desde {miembroDesde}</p>
          {usuario.bio && <p className="mt-3 max-w-xl text-sm text-papel/70">{usuario.bio}</p>}
        </div>
      </header>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-y border-borde py-4">
        {numeros.map((n) => (
          <div key={n.label} className="font-mono text-xs text-papel/50">
            <span className="text-base text-papel">{n.valor}</span> {n.label}
          </div>
        ))}
      </div>

      <section className="mt-12">
        <EtiquetaSeccion>El panteón</EtiquetaSeccion>
        <h2 className="mt-4 font-display text-2xl sm:text-3xl">
          Los directores de @{usuario.username}
        </h2>

        {panteon.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {panteon.map((entrada, i) => (
              <TarjetaPanteon key={entrada.id} entrada={entrada} orden={i + 1} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-papel/40">
            @{usuario.username} todavía no armó su panteón de directores.
          </p>
        )}
      </section>
    </div>
  );
}
