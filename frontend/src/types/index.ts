// Tipos del dominio: espejan las respuestas de la API de Raccord.

export type RolCredito =
  | 'DIRECTOR'
  | 'ACTOR'
  | 'GUIONISTA'
  | 'FOTOGRAFIA'
  | 'MONTAJE'
  | 'MUSICA'
  | 'PRODUCTOR';

export interface PersonaResumen {
  id: string;
  nombre: string;
  fotoUrl: string | null;
}

export interface PeliculaResumen {
  id: string;
  titulo: string;
  fechaEstreno: string | null;
  duracionMin: number | null;
  posterUrl: string | null;
  generos: string[];
}

export interface ListadoPeliculas {
  items: PeliculaResumen[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface DecadaPeliculas {
  decada: number;
  peliculas: PeliculaResumen[];
}

export interface PeliculaDetalle {
  id: string;
  tmdbId: number;
  titulo: string;
  tituloOriginal: string | null;
  sinopsis: string | null;
  fechaEstreno: string | null;
  duracionMin: number | null;
  aspectRatio: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  generos: { id: string; nombre: string }[];
  directores: PersonaResumen[];
  cast: (PersonaResumen & { personaje: string | null })[];
  crew: (PersonaResumen & { rol: RolCredito })[];
}

export interface ColorSwatch {
  colorHex: string;
  porcentaje: number;
  stillUrl: string | null;
}

export interface PersonaDetalle {
  id: string;
  tmdbId: number | null;
  nombre: string;
  biografia: string | null;
  fechaNacimiento: string | null;
  lugarNacimiento: string | null;
  fotoUrl: string | null;
  estilos: { id: string; nombre: string }[];
}

export interface CreditoFilmografia {
  rol: RolCredito;
  personaje: string | null;
  pelicula: {
    id: string;
    titulo: string;
    fechaEstreno: string | null;
    duracionMin: number | null;
    posterUrl: string | null;
  };
}

export interface Colaborador extends PersonaResumen {
  colaboraciones: number;
  porRol: Partial<Record<RolCredito, number>>;
}

export interface FirmaVisualItem {
  peliculaId: string;
  titulo: string;
  anio: number | null;
  posterUrl: string | null;
  colores: { colorHex: string; porcentaje: number }[];
}

export interface PremioGanado {
  anio: number;
  ganador: boolean;
  premio: { nombre: string; categoria: string };
  pelicula: { id: string; titulo: string } | null;
}

export interface PersonaBusqueda {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  esDirector: boolean;
}

export interface PeliculaBusqueda {
  id: string;
  titulo: string;
  fechaEstreno: string | null;
  duracionMin: number | null;
  posterUrl: string | null;
}

export interface ResultadoBusqueda {
  peliculas: PeliculaBusqueda[];
  personas: PersonaBusqueda[];
}

export interface DirectorResumen {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  peliculasDirigidas: number;
}

export interface EtapaCarrera {
  id: string;
  titulo: string;
  descripcion: string;
  anioInicio: number;
  anioFin: number | null;
}
