import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parsear } from '../../middlewares/validateRequest';
import { z } from 'zod';
import { watchlistService, likesService, estadoSobrePelicula } from './watchlist.service';

const peliculaIdParams = z.object({ peliculaId: z.string().uuid('peliculaId inválido') });

function toggleHandlers(servicio: typeof watchlistService | typeof likesService) {
  const agregar: RequestHandler = async (req, res, next) => {
    try {
      const { peliculaId } = parsear(peliculaIdParams, req.params);
      await servicio.agregar(req.usuario!.id, peliculaId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  const quitar: RequestHandler = async (req, res, next) => {
    try {
      const { peliculaId } = parsear(peliculaIdParams, req.params);
      await servicio.quitar(req.usuario!.id, peliculaId);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
  return { agregar, quitar };
}

const watchlist = toggleHandlers(watchlistService);
const likes = toggleHandlers(likesService);

export const watchlistRouter = Router();
watchlistRouter.use(requireAuth);
watchlistRouter.post('/:peliculaId', watchlist.agregar);
watchlistRouter.delete('/:peliculaId', watchlist.quitar);

export const likesRouter = Router();
likesRouter.use(requireAuth);
likesRouter.post('/:peliculaId', likes.agregar);
likesRouter.delete('/:peliculaId', likes.quitar);

/** GET /api/peliculas/:peliculaId/mi-estado — toggles de la película para el usuario. */
export const miEstadoPelicula: RequestHandler = async (req, res, next) => {
  try {
    const { peliculaId } = parsear(peliculaIdParams, req.params);
    res.json(await estadoSobrePelicula(req.usuario!.id, peliculaId));
  } catch (err) {
    next(err);
  }
};
