-- Popularidad de TMDB: criterio de "lo más importante por década" (Pelicula)
-- y disponible en Persona para rankings futuros. Se actualiza en cada sync.
ALTER TABLE "Pelicula" ADD COLUMN "popularity" DOUBLE PRECISION;
ALTER TABLE "Persona" ADD COLUMN "popularity" DOUBLE PRECISION;
