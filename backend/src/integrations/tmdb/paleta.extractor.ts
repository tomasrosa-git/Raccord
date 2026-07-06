import { Vibrant } from 'node-vibrant/node';
import { prisma } from '../../config/prisma';
import { getTmdbClient } from './tmdb.client';

const BACKDROPS_POR_PELICULA = 5;
const SWATCHES_POR_PELICULA = 6;
// w780 alcanza para extraer color y baja mucho el peso de descarga vs original.
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

interface Swatch {
  colorHex: string;
  population: number;
  stillUrl: string;
}

async function extraerSwatchesDeImagen(filePath: string): Promise<Swatch[]> {
  const stillUrl = `${IMAGE_BASE}${filePath}`;
  const res = await fetch(stillUrl);
  if (!res.ok) throw new Error(`No se pudo descargar ${stillUrl} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const paleta = await Vibrant.from(buffer).getPalette();
  return Object.values(paleta)
    .filter((swatch) => swatch !== null)
    .map((swatch) => ({
      colorHex: swatch.hex,
      population: swatch.population,
      stillUrl,
    }));
}

/**
 * Extrae la paleta de una película desde sus primeros backdrops en TMDB
 * y reemplaza sus filas de ColorPaleta (idempotente).
 * Devuelve la cantidad de colores guardados (0 si no hay backdrops).
 */
export async function extraerPaletaDePelicula(pelicula: { id: string; tmdbId: number }) {
  const { backdrops } = await getTmdbClient().getImagenesPelicula(pelicula.tmdbId);
  const primeros = backdrops.slice(0, BACKDROPS_POR_PELICULA);
  if (primeros.length === 0) return 0;

  const porImagen = await Promise.all(primeros.map((b) => extraerSwatchesDeImagen(b.file_path)));

  // El mismo hex puede salir de varios stills: se consolida sumando poblaciones.
  const porHex = new Map<string, Swatch>();
  for (const s of porImagen.flat()) {
    const existente = porHex.get(s.colorHex);
    if (existente) existente.population += s.population;
    else porHex.set(s.colorHex, { ...s });
  }

  const top = [...porHex.values()]
    .sort((a, b) => b.population - a.population)
    .slice(0, SWATCHES_POR_PELICULA);
  const poblacionTotal = top.reduce((sum, s) => sum + s.population, 0);
  if (poblacionTotal === 0) return 0;

  await prisma.$transaction([
    prisma.colorPaleta.deleteMany({ where: { peliculaId: pelicula.id } }),
    prisma.colorPaleta.createMany({
      data: top.map((s) => ({
        peliculaId: pelicula.id,
        colorHex: s.colorHex,
        porcentaje: s.population / poblacionTotal,
        stillUrl: s.stillUrl,
      })),
    }),
  ]);

  return top.length;
}
