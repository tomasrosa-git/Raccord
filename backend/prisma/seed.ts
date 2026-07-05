import { prisma } from '../src/config/prisma';

// Seed real en Fase 3: sync de los 15 directores fundacionales desde TMDB.
async function main() {
  console.log('Seed pendiente de implementación (Fase 3 — integración TMDB).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
