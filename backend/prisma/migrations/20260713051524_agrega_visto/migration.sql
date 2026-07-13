-- CreateTable
CREATE TABLE "Visto" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "peliculaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Visto_usuarioId_peliculaId_key" ON "Visto"("usuarioId", "peliculaId");

-- AddForeignKey
ALTER TABLE "Visto" ADD CONSTRAINT "Visto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visto" ADD CONSTRAINT "Visto_peliculaId_fkey" FOREIGN KEY ("peliculaId") REFERENCES "Pelicula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS: mismo criterio que el resto (el backend usa el rol owner y bypasea RLS).
ALTER TABLE "Visto" ENABLE ROW LEVEL SECURITY;
