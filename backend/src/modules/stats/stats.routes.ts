import { Router } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '../../config/prisma';
import { conCache } from '../../shared/utils/cache';
import { personaRepository } from '../persona/persona.repository';

const TTL_SEGUNDOS = 3600;

/**
 * Números del catálogo para la home. El conteo de directores reusa el mismo
 * criterio que /personas/directores (umbral de películas dirigidas), para que
 * la home y el listado nunca digan cosas distintas.
 */
const obtener: RequestHandler = async (_req, res, next) => {
  try {
    const stats = await conCache('stats:catalogo', TTL_SEGUNDOS, async () => {
      const [peliculas, directores] = await Promise.all([
        prisma.pelicula.count(),
        personaRepository.listarDirectores(),
      ]);
      return { peliculas, directores: directores.length };
    });
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const statsRouter = Router();
statsRouter.get('/', obtener);
