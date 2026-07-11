import pLimit from 'p-limit';
import { prisma } from '../../config/prisma';
import { getTmdbClient, tmdbImageUrl } from '../../integrations/tmdb/tmdb.client';
import type { TmdbPeliculaListado, TmdbVideo } from '../../integrations/tmdb/tmdb.types';

/**
 * Novedades del cine en tiempo (casi) real, directo de TMDB: cartelera
 * argentina, próximos estrenos, tendencias de la semana y los últimos
 * tráilers. Es contenido de portada — vive fuera del catálogo curado, pero
 * cuando una película sí está en Raccord se enlaza a su ficha (`peliculaId`).
 */

export interface NovedadPelicula {
  tmdbId: number;
  titulo: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  fechaEstreno: string | null;
  votoPromedio: number | null;
  peliculaId: string | null;
}

export interface TrailerNovedad {
  tmdbId: number;
  titulo: string;
  youtubeKey: string;
  publicadoEn: string;
  backdropUrl: string | null;
  fechaEstreno: string | null;
  peliculaId: string | null;
}

export interface Novedades {
  cartelera: NovedadPelicula[];
  proximos: NovedadPelicula[];
  tendencias: NovedadPelicula[];
  trailers: TrailerNovedad[];
}

const MAX_POR_LISTA = 12;
const MAX_TRAILERS = 6;
// A cuántas películas (las más populares de cartelera + próximos) pedirles videos.
const CANDIDATAS_TRAILER = 14;
const CONCURRENCIA_TMDB = 4;

function aNovedad(p: TmdbPeliculaListado, catalogo: Map<number, string>): NovedadPelicula {
  return {
    tmdbId: p.id,
    titulo: p.title,
    posterUrl: p.poster_path ? tmdbImageUrl.poster(p.poster_path) : null,
    backdropUrl: p.backdrop_path ? tmdbImageUrl.backdrop(p.backdrop_path) : null,
    fechaEstreno: p.release_date || null,
    votoPromedio: p.vote_count > 0 ? p.vote_average : null,
    peliculaId: catalogo.get(p.id) ?? null,
  };
}

/** El mejor tráiler de una película: YouTube, preferentemente oficial y en español. */
function elegirTrailer(videos: TmdbVideo[]): TmdbVideo | null {
  const candidatos = videos
    .filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
    .sort((a, b) => {
      const esEs = (v: TmdbVideo) => Number(v.iso_639_1 === 'es');
      const oficial = (v: TmdbVideo) => Number(v.official);
      return (
        esEs(b) - esEs(a) ||
        oficial(b) - oficial(a) ||
        b.published_at.localeCompare(a.published_at)
      );
    });
  return candidatos[0] ?? null;
}

export async function obtenerNovedades(): Promise<Novedades> {
  const tmdb = getTmdbClient();
  // Próximos: de mañana a seis meses. El orden por popularidad ya viene de TMDB;
  // acá se re-ordena por fecha para leerse como calendario de estrenos.
  const ahora = new Date();
  const hoy = ahora.toISOString().slice(0, 10);
  const horizonte = new Date(ahora);
  horizonte.setMonth(horizonte.getMonth() + 6);

  const [cartelera, proximos, tendencias] = await Promise.all([
    tmdb.getEnCartelera(),
    tmdb.descubrirProximos(hoy, horizonte.toISOString().slice(0, 10)),
    tmdb.getTendenciasSemana(),
  ]);

  const proximosFuturos = proximos.results
    .filter((p) => p.release_date && p.release_date > hoy)
    // Sin traducción al español ni título latino no hay nada que mostrar acá.
    .filter((p) => /[A-Za-z]/.test(p.title))
    .sort((a, b) => a.release_date.localeCompare(b.release_date));

  // Tráilers: de lo que está en salas o por estrenarse, priorizando popularidad.
  const vistos = new Set<number>();
  const candidatas = [...cartelera.results, ...proximosFuturos]
    .filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, CANDIDATAS_TRAILER);

  const limit = pLimit(CONCURRENCIA_TMDB);
  const conVideos = await Promise.all(
    candidatas.map((p) =>
      limit(async () => ({
        pelicula: p,
        video: elegirTrailer(
          (await tmdb.getVideosPelicula(p.id).catch(() => ({ results: [] }))).results
        ),
      }))
    )
  );

  // Un solo lookup contra el catálogo para todas las listas.
  const tmdbIds = [
    ...new Set(
      [...cartelera.results, ...proximosFuturos, ...tendencias.results].map((p) => p.id)
    ),
  ];
  const enCatalogo = await prisma.pelicula.findMany({
    where: { tmdbId: { in: tmdbIds } },
    select: { id: true, tmdbId: true },
  });
  const catalogo = new Map(enCatalogo.map((p) => [p.tmdbId as number, p.id]));

  const trailers: TrailerNovedad[] = conVideos
    .flatMap(({ pelicula, video }) =>
      video
        ? [
            {
              tmdbId: pelicula.id,
              titulo: pelicula.title,
              youtubeKey: video.key,
              publicadoEn: video.published_at,
              backdropUrl: pelicula.backdrop_path
                ? tmdbImageUrl.backdrop(pelicula.backdrop_path)
                : null,
              fechaEstreno: pelicula.release_date || null,
              peliculaId: catalogo.get(pelicula.id) ?? null,
            },
          ]
        : []
    )
    .sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn))
    .slice(0, MAX_TRAILERS);

  return {
    cartelera: cartelera.results.slice(0, MAX_POR_LISTA).map((p) => aNovedad(p, catalogo)),
    proximos: proximosFuturos.slice(0, MAX_POR_LISTA).map((p) => aNovedad(p, catalogo)),
    tendencias: tendencias.results.slice(0, MAX_POR_LISTA).map((p) => aNovedad(p, catalogo)),
    trailers,
  };
}
