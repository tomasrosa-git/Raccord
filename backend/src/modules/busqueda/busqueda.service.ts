import { prisma } from '../../config/prisma';

const MAX_RESULTADOS = 12;

interface PeliculaResultado {
  id: string;
  titulo: string;
  fechaEstreno: Date | null;
  duracionMin: number | null;
  posterUrl: string | null;
}

interface PersonaResultado {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  esDirector: boolean;
}

/**
 * Búsqueda unificada por texto: películas (título u original) y personas
 * (nombre). Insensible a mayúsculas y acentos vía unaccent — clave para el
 * público hispanohablante ("parasitos" encuentra "Parásitos"). Por eso usa
 * queries crudas: Prisma no expone unaccent en su API tipada.
 */
export const busquedaService = {
  async buscar(q: string) {
    const termino = q.trim();
    if (termino.length === 0) return { peliculas: [], personas: [] };

    const patron = `%${termino}%`;

    const [peliculas, personas] = await Promise.all([
      prisma.$queryRaw<PeliculaResultado[]>`
        SELECT id, titulo, "fechaEstreno", "duracionMin", "posterUrl"
        FROM "Pelicula"
        WHERE unaccent(titulo) ILIKE unaccent(${patron})
           OR unaccent(coalesce("tituloOriginal", '')) ILIKE unaccent(${patron})
        ORDER BY "fechaEstreno" DESC NULLS LAST
        LIMIT ${MAX_RESULTADOS}
      `,
      prisma.$queryRaw<PersonaResultado[]>`
        SELECT p.id, p.nombre, p."fotoUrl",
          EXISTS(
            SELECT 1 FROM "CreditoPelicula" c
            WHERE c."personaId" = p.id AND c.rol = 'DIRECTOR'
          ) AS "esDirector"
        FROM "Persona" p
        WHERE unaccent(p.nombre) ILIKE unaccent(${patron})
        ORDER BY "esDirector" DESC, p.nombre ASC
        LIMIT ${MAX_RESULTADOS}
      `,
    ]);

    return { peliculas, personas };
  },
};
