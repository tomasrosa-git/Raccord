import { env } from '../../config/env';
import { AppError } from '../../shared/errors/AppError';
import type {
  TmdbPersona,
  TmdbBusquedaPersonas,
  TmdbPeliculaDetalle,
  TmdbCreditosDePersona,
  TmdbImagenesPelicula,
  TmdbListadoPeliculas,
  TmdbVideosPelicula,
} from './tmdb.types';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Idioma principal del catálogo; TMDB devuelve campos vacíos si no hay
// traducción, en ese caso se hace fallback a en-US campo por campo.
const IDIOMA = 'es-AR';
const IDIOMA_FALLBACK = 'en-US';

// Región para fechas de estreno y cartelera (now_playing / upcoming).
const REGION = 'AR';

export const tmdbImageUrl = {
  poster: (path: string) => `${IMAGE_BASE}/w500${path}`,
  backdrop: (path: string) => `${IMAGE_BASE}/w1280${path}`,
  perfil: (path: string) => `${IMAGE_BASE}/h632${path}`,
};

class TmdbClient {
  private readonly apiKey: string;
  private readonly esTokenV4: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // TMDB da dos credenciales: la "API Key" v3 (hex corto) y el
    // "Read Access Token" v4 (JWT largo). Soportamos ambas.
    this.esTokenV4 = apiKey.startsWith('eyJ');
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [clave, valor] of Object.entries(params)) {
      url.searchParams.set(clave, valor);
    }
    if (!this.esTokenV4) url.searchParams.set('api_key', this.apiKey);

    const res = await fetch(url, {
      headers: this.esTokenV4 ? { Authorization: `Bearer ${this.apiKey}` } : undefined,
    });

    if (res.status === 404) {
      throw AppError.notFound(`TMDB: recurso no encontrado (${path})`);
    }
    if (!res.ok) {
      throw new Error(`TMDB respondió ${res.status} en ${path}`);
    }
    return (await res.json()) as T;
  }

  buscarPersonas(nombre: string): Promise<TmdbBusquedaPersonas> {
    return this.get('/search/person', { query: nombre, language: IDIOMA });
  }

  async getPersona(tmdbId: number): Promise<TmdbPersona> {
    const persona = await this.get<TmdbPersona>(`/person/${tmdbId}`, { language: IDIOMA });
    if (!persona.biography) {
      const fallback = await this.get<TmdbPersona>(`/person/${tmdbId}`, {
        language: IDIOMA_FALLBACK,
      });
      persona.biography = fallback.biography;
    }
    return persona;
  }

  getCreditosDePersona(tmdbId: number): Promise<TmdbCreditosDePersona> {
    return this.get(`/person/${tmdbId}/movie_credits`, { language: IDIOMA });
  }

  async getPeliculaConCreditos(tmdbId: number): Promise<TmdbPeliculaDetalle> {
    const pelicula = await this.get<TmdbPeliculaDetalle>(`/movie/${tmdbId}`, {
      language: IDIOMA,
      append_to_response: 'credits',
    });
    if (!pelicula.overview) {
      const fallback = await this.get<TmdbPeliculaDetalle>(`/movie/${tmdbId}`, {
        language: IDIOMA_FALLBACK,
      });
      pelicula.overview = fallback.overview;
    }
    return pelicula;
  }

  getImagenesPelicula(tmdbId: number): Promise<TmdbImagenesPelicula> {
    // Sin `language`: las imágenes no dependen del idioma y filtrarlas lo vaciaría.
    return this.get(`/movie/${tmdbId}/images`);
  }

  /** Detalle liviano (sin créditos ni fallback de idioma) — para backfills puntuales. */
  getPeliculaBasica(tmdbId: number): Promise<TmdbPeliculaDetalle> {
    return this.get(`/movie/${tmdbId}`, { language: IDIOMA });
  }

  /** Películas en salas de Argentina esta semana. */
  getEnCartelera(): Promise<TmdbListadoPeliculas> {
    return this.get('/movie/now_playing', { language: IDIOMA, region: REGION });
  }

  /**
   * Próximos estrenos por ventana de fechas (global, orden por popularidad).
   * `/movie/upcoming` con región AR devuelve 3-4 títulos: discover rinde más.
   */
  descubrirProximos(desde: string, hasta: string): Promise<TmdbListadoPeliculas> {
    return this.get('/discover/movie', {
      language: IDIOMA,
      sort_by: 'popularity.desc',
      'primary_release_date.gte': desde,
      'primary_release_date.lte': hasta,
    });
  }

  /** Lo más visto de la semana según TMDB (global, no por región). */
  getTendenciasSemana(): Promise<TmdbListadoPeliculas> {
    return this.get('/trending/movie/week', { language: IDIOMA });
  }

  /** Videos de una película. `include_video_language` suma los tráilers en inglés. */
  getVideosPelicula(tmdbId: number): Promise<TmdbVideosPelicula> {
    return this.get(`/movie/${tmdbId}/videos`, {
      language: IDIOMA,
      include_video_language: 'es,en',
    });
  }
}

let instancia: TmdbClient | null = null;

export function getTmdbClient(): TmdbClient {
  if (!instancia) {
    if (!env.TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY no está configurada en el .env');
    }
    instancia = new TmdbClient(env.TMDB_API_KEY);
  }
  return instancia;
}
