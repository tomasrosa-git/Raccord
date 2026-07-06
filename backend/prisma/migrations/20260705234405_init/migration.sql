-- CreateEnum
CREATE TYPE "RolCredito" AS ENUM ('DIRECTOR', 'ACTOR', 'GUIONISTA', 'FOTOGRAFIA', 'MONTAJE', 'MUSICA', 'PRODUCTOR');

-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('USUARIO', 'ADMIN');

-- CreateTable
CREATE TABLE "Persona" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "nombre" TEXT NOT NULL,
    "biografia" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "lugarNacimiento" TEXT,
    "fotoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelicula" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "tituloOriginal" TEXT,
    "sinopsis" TEXT,
    "fechaEstreno" TIMESTAMP(3),
    "duracionMin" INTEGER,
    "aspectRatio" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pelicula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genero" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Genero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeliculaGenero" (
    "peliculaId" TEXT NOT NULL,
    "generoId" TEXT NOT NULL,

    CONSTRAINT "PeliculaGenero_pkey" PRIMARY KEY ("peliculaId","generoId")
);

-- CreateTable
CREATE TABLE "CreditoPelicula" (
    "id" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "rol" "RolCredito" NOT NULL,
    "personaje" TEXT,
    "orden" INTEGER,

    CONSTRAINT "CreditoPelicula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorPaleta" (
    "id" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "porcentaje" DOUBLE PRECISION NOT NULL,
    "stillUrl" TEXT,

    CONSTRAINT "ColorPaleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Premio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "Premio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PremioGanado" (
    "id" TEXT NOT NULL,
    "premioId" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "ganador" BOOLEAN NOT NULL DEFAULT false,
    "peliculaId" TEXT,
    "personaId" TEXT,

    CONSTRAINT "PremioGanado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtapaCarrera" (
    "id" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "anioInicio" INTEGER NOT NULL,
    "anioFin" INTEGER,

    CONSTRAINT "EtapaCarrera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstiloTag" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "EstiloTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonaEstiloTag" (
    "personaId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "PersonaEstiloTag_pkey" PRIMARY KEY ("personaId","tagId")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'USUARIO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "puntuacion" INTEGER NOT NULL,
    "contieneSpoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeguidorPersona" (
    "usuarioId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,

    CONSTRAINT "SeguidorPersona_pkey" PRIMARY KEY ("usuarioId","personaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Persona_tmdbId_key" ON "Persona"("tmdbId");

-- CreateIndex
CREATE INDEX "Persona_nombre_idx" ON "Persona"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Pelicula_tmdbId_key" ON "Pelicula"("tmdbId");

-- CreateIndex
CREATE INDEX "Pelicula_titulo_idx" ON "Pelicula"("titulo");

-- CreateIndex
CREATE UNIQUE INDEX "Genero_nombre_key" ON "Genero"("nombre");

-- CreateIndex
CREATE INDEX "CreditoPelicula_personaId_rol_idx" ON "CreditoPelicula"("personaId", "rol");

-- CreateIndex
CREATE INDEX "CreditoPelicula_peliculaId_idx" ON "CreditoPelicula"("peliculaId");

-- CreateIndex
CREATE INDEX "ColorPaleta_peliculaId_idx" ON "ColorPaleta"("peliculaId");

-- CreateIndex
CREATE UNIQUE INDEX "EstiloTag_nombre_key" ON "EstiloTag"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_usuarioId_idx" ON "RefreshToken"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_usuarioId_peliculaId_key" ON "Review"("usuarioId", "peliculaId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_usuarioId_peliculaId_key" ON "WatchlistItem"("usuarioId", "peliculaId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_usuarioId_peliculaId_key" ON "Like"("usuarioId", "peliculaId");

-- AddForeignKey
ALTER TABLE "PeliculaGenero" ADD CONSTRAINT "PeliculaGenero_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeliculaGenero" ADD CONSTRAINT "PeliculaGenero_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES "Genero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoPelicula" ADD CONSTRAINT "CreditoPelicula_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditoPelicula" ADD CONSTRAINT "CreditoPelicula_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorPaleta" ADD CONSTRAINT "ColorPaleta_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremioGanado" ADD CONSTRAINT "PremioGanado_premioId_fkey" FOREIGN KEY ("premioId") REFERENCES "Premio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremioGanado" ADD CONSTRAINT "PremioGanado_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremioGanado" ADD CONSTRAINT "PremioGanado_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtapaCarrera" ADD CONSTRAINT "EtapaCarrera_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaEstiloTag" ADD CONSTRAINT "PersonaEstiloTag_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonaEstiloTag" ADD CONSTRAINT "PersonaEstiloTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "EstiloTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguidorPersona" ADD CONSTRAINT "SeguidorPersona_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeguidorPersona" ADD CONSTRAINT "SeguidorPersona_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
