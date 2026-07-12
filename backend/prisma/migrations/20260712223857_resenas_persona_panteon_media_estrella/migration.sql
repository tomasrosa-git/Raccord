-- Migración de escala: la puntuación pasa de estrellas enteras (1..5) a medias
-- estrellas (1..10). Las reseñas existentes tenían N estrellas → 2N en la nueva
-- escala (ej: 4★ = 8). Se corre una sola vez, antes de exponer la escala nueva.
UPDATE "Review" SET "puntuacion" = "puntuacion" * 2 WHERE "puntuacion" <= 5;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ReviewPersona" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "contieneSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewPersona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectorFavorito" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "peliculaFavoritaId" TEXT,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectorFavorito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPersona_usuarioId_personaId_key" ON "ReviewPersona"("usuarioId", "personaId");

-- CreateIndex
CREATE INDEX "DirectorFavorito_usuarioId_orden_idx" ON "DirectorFavorito"("usuarioId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "DirectorFavorito_usuarioId_personaId_key" ON "DirectorFavorito"("usuarioId", "personaId");

-- AddForeignKey
ALTER TABLE "ReviewPersona" ADD CONSTRAINT "ReviewPersona_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewPersona" ADD CONSTRAINT "ReviewPersona_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectorFavorito" ADD CONSTRAINT "DirectorFavorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectorFavorito" ADD CONSTRAINT "DirectorFavorito_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectorFavorito" ADD CONSTRAINT "DirectorFavorito_peliculaFavoritaId_fkey" FOREIGN KEY ("peliculaFavoritaId") REFERENCES "Pelicula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS: mismas razones que la migración 20260708215929 (cerrar la API pública
-- de Supabase). El backend usa el rol owner y bypasea RLS.
ALTER TABLE "ReviewPersona" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DirectorFavorito" ENABLE ROW LEVEL SECURITY;
