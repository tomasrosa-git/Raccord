-- Valoración de TMDB por película: nota media (0–10) y cantidad de votos que la
-- respaldan. El conteo permite un piso al ordenar por "mejor valoradas" (una
-- película con un solo voto de 10 no debe encabezar). Se actualiza en cada sync.
ALTER TABLE "Pelicula" ADD COLUMN "votoPromedio" DOUBLE PRECISION;
ALTER TABLE "Pelicula" ADD COLUMN "votoConteo" INTEGER;
