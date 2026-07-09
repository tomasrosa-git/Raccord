import pLimit from 'p-limit';
import { Prisma } from '@prisma/client';
import type { RolCredito } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { TMDB_MAX_CONCURRENCIA } from '../../config/constants';
import { getTmdbClient, tmdbImageUrl } from './tmdb.client';
import type { TmdbPeliculaDetalle } from './tmdb.types';

// Limiters separados: usar el mismo para tareas anidadas causaría deadlock
// (las tareas exteriores ocupan todos los slots y las interiores esperan para siempre).
const tmdbLimit = pLimit(TMDB_MAX_CONCURRENCIA);
const dbLimit = pLimit(10);

const MAX_CAST_POR_PELICULA = 10;

// Jobs de crew de TMDB que nos interesan, mapeados a nuestro enum.
const JOB_A_ROL: Record<string, RolCredito> = {
  Director: 'DIRECTOR',
  Screenplay: 'GUIONISTA',
  Writer: 'GUIONISTA',
  'Director of Photography': 'FOTOGRAFIA',
  Editor: 'MONTAJE',
  'Original Music Composer': 'MUSICA',
  Producer: 'PRODUCTOR',
};

/**
 * Reintenta una vez ante P2002: dos upserts concurrentes sobre la misma clave
 * única pueden chocar (Prisma no siempre usa el upsert nativo atómico);
 * al reintentar, la fila ya existe y el upsert toma la rama de update.
 */
async function conReintentoPorCarrera<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return fn();
    }
    throw err;
  }
}

/** Crea la persona si no existe; si existe no pisa datos (puede estar curada a mano). */
async function upsertPersonaMinima(datos: { tmdbId: number; nombre: string; fotoPath: string | null }) {
  return conReintentoPorCarrera(() => prisma.persona.upsert({
    where: { tmdbId: datos.tmdbId },
    update: {},
    create: {
      tmdbId: datos.tmdbId,
      nombre: datos.nombre,
      fotoUrl: datos.fotoPath ? tmdbImageUrl.perfil(datos.fotoPath) : null,
    },
  }));
}

async function upsertGeneros(nombres: string[]) {
  return Promise.all(
    nombres.map((nombre) =>
      conReintentoPorCarrera(() =>
        prisma.genero.upsert({ where: { nombre }, update: {}, create: { nombre } })
      )
    )
  );
}

async function guardarPelicula(detalle: TmdbPeliculaDetalle) {
  const pelicula = await prisma.pelicula.upsert({
    where: { tmdbId: detalle.id },
    update: {
      titulo: detalle.title,
      tituloOriginal: detalle.original_title,
      sinopsis: detalle.overview || null,
      fechaEstreno: detalle.release_date ? new Date(detalle.release_date) : null,
      duracionMin: detalle.runtime || null,
      posterUrl: detalle.poster_path ? tmdbImageUrl.poster(detalle.poster_path) : null,
      backdropUrl: detalle.backdrop_path ? tmdbImageUrl.backdrop(detalle.backdrop_path) : null,
      popularity: detalle.popularity ?? null,
    },
    create: {
      tmdbId: detalle.id,
      titulo: detalle.title,
      tituloOriginal: detalle.original_title,
      sinopsis: detalle.overview || null,
      fechaEstreno: detalle.release_date ? new Date(detalle.release_date) : null,
      duracionMin: detalle.runtime || null,
      posterUrl: detalle.poster_path ? tmdbImageUrl.poster(detalle.poster_path) : null,
      backdropUrl: detalle.backdrop_path ? tmdbImageUrl.backdrop(detalle.backdrop_path) : null,
      popularity: detalle.popularity ?? null,
    },
  });

  // Géneros: se reconstruye la relación completa (idempotente).
  const generos = await upsertGeneros(detalle.genres.map((g) => g.name));
  await prisma.peliculaGenero.deleteMany({ where: { peliculaId: pelicula.id } });
  await prisma.peliculaGenero.createMany({
    data: generos.map((g) => ({ peliculaId: pelicula.id, generoId: g.id })),
  });

  return pelicula;
}

async function guardarCreditos(peliculaId: string, detalle: TmdbPeliculaDetalle) {
  const creditos = detalle.credits;
  if (!creditos) return;

  const cast = creditos.cast.slice(0, MAX_CAST_POR_PELICULA);
  const crew = creditos.crew.filter((c) => JOB_A_ROL[c.job]);

  // Upsert de todas las personas involucradas, deduplicadas por tmdbId.
  const personasUnicas = new Map<number, { tmdbId: number; nombre: string; fotoPath: string | null }>();
  for (const miembro of [...cast, ...crew]) {
    personasUnicas.set(miembro.id, {
      tmdbId: miembro.id,
      nombre: miembro.name,
      fotoPath: miembro.profile_path,
    });
  }
  const personas = await Promise.all(
    [...personasUnicas.values()].map((p) => dbLimit(() => upsertPersonaMinima(p)))
  );
  const idPorTmdbId = new Map(personas.map((p) => [p.tmdbId!, p.id]));

  // Reconstrucción completa de créditos de la película (idempotente).
  const filas: {
    peliculaId: string;
    personaId: string;
    rol: RolCredito;
    personaje?: string;
    orden?: number;
  }[] = [];

  for (const actor of cast) {
    filas.push({
      peliculaId,
      personaId: idPorTmdbId.get(actor.id)!,
      rol: 'ACTOR',
      personaje: actor.character || undefined,
      orden: actor.order,
    });
  }

  const vistos = new Set<string>();
  for (const miembro of crew) {
    const rol = JOB_A_ROL[miembro.job]!;
    const clave = `${miembro.id}:${rol}`;
    if (vistos.has(clave)) continue; // ej. "Screenplay" y "Writer" de la misma persona
    vistos.add(clave);
    filas.push({ peliculaId, personaId: idPorTmdbId.get(miembro.id)!, rol });
  }

  await prisma.creditoPelicula.deleteMany({ where: { peliculaId } });
  await prisma.creditoPelicula.createMany({ data: filas });
}

export const tmdbSyncService = {
  /** Sincroniza una película puntual: datos, géneros y créditos completos. */
  async syncPelicula(tmdbId: number) {
    const detalle = await getTmdbClient().getPeliculaConCreditos(tmdbId);
    const pelicula = await guardarPelicula(detalle);
    await guardarCreditos(pelicula.id, detalle);
    return pelicula;
  },

  /**
   * Sincroniza una persona con datos completos y, si dirigió películas,
   * toda su filmografía como director (cada película con créditos completos).
   */
  async syncPersona(tmdbId: number) {
    const cliente = getTmdbClient();
    const datos = await cliente.getPersona(tmdbId);

    const persona = await prisma.persona.upsert({
      where: { tmdbId },
      update: {
        nombre: datos.name,
        biografia: datos.biography || null,
        fechaNacimiento: datos.birthday ? new Date(datos.birthday) : null,
        lugarNacimiento: datos.place_of_birth,
        fotoUrl: datos.profile_path ? tmdbImageUrl.perfil(datos.profile_path) : null,
        popularity: datos.popularity ?? null,
      },
      create: {
        tmdbId,
        nombre: datos.name,
        biografia: datos.biography || null,
        fechaNacimiento: datos.birthday ? new Date(datos.birthday) : null,
        lugarNacimiento: datos.place_of_birth,
        fotoUrl: datos.profile_path ? tmdbImageUrl.perfil(datos.profile_path) : null,
        popularity: datos.popularity ?? null,
      },
    });

    const creditos = await cliente.getCreditosDePersona(tmdbId);
    const dirigidas = creditos.crew.filter((c) => c.job === 'Director' && c.release_date);

    const resultados = await Promise.allSettled(
      dirigidas.map((c) => tmdbLimit(() => this.syncPelicula(c.id)))
    );

    const fallidas = resultados.filter((r) => r.status === 'rejected');
    for (const fallo of fallidas) {
      console.error(`  ⚠ película falló:`, (fallo as PromiseRejectedResult).reason?.message ?? fallo);
    }

    return {
      persona,
      peliculasSincronizadas: resultados.length - fallidas.length,
      peliculasFallidas: fallidas.length,
    };
  },

  /**
   * Busca una persona por nombre y devuelve el mejor candidato (para el seed).
   * Prioriza directores y desempata por popularidad: TMDB tiene homónimos
   * con popularidad 0 que pueden aparecer primero en los resultados.
   */
  async buscarTmdbId(nombre: string): Promise<number | null> {
    const { results } = await getTmdbClient().buscarPersonas(nombre);
    if (results.length === 0) return null;
    const directores = results.filter((r) => r.known_for_department === 'Directing');
    const candidatos = directores.length > 0 ? directores : results;
    return candidatos.sort((a, b) => b.popularity - a.popularity)[0]!.id;
  },
};
