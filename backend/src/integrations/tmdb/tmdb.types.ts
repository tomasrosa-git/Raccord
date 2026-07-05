// Tipos de las respuestas de la API v3 de TMDB (solo los campos que usamos).

export interface TmdbPersona {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
}

export interface TmdbResultadoBusquedaPersona {
  id: number;
  name: string;
  known_for_department: string;
  popularity: number;
}

export interface TmdbBusquedaPersonas {
  results: TmdbResultadoBusquedaPersona[];
}

export interface TmdbGenero {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface TmdbCreditos {
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbPeliculaDetalle {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string; // "" si no tiene
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  genres: TmdbGenero[];
  credits?: TmdbCreditos;
}

export interface TmdbCreditoDireccion {
  id: number; // id de la película
  title: string;
  release_date: string;
  job: string;
}

export interface TmdbCreditosDePersona {
  crew: TmdbCreditoDireccion[];
}

export interface TmdbImagen {
  file_path: string;
  aspect_ratio: number;
  vote_average: number;
}

export interface TmdbImagenesPelicula {
  backdrops: TmdbImagen[];
  posters: TmdbImagen[];
}
