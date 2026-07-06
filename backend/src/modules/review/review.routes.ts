import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validateRequest, parsear } from '../../middlewares/validateRequest';
import { idParamsSchema } from '../persona/persona.schema';
import { crearReviewSchema, editarReviewSchema } from './review.schema';
import { reviewService } from './review.service';
import type { CrearReviewInput, EditarReviewInput } from './review.schema';

const listar: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await reviewService.listarDePelicula(id));
  } catch (err) {
    next(err);
  }
};

const crear: RequestHandler<unknown, unknown, CrearReviewInput> = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.status(201).json(await reviewService.crear(req.usuario!.id, id, req.body));
  } catch (err) {
    next(err);
  }
};

const editar: RequestHandler<unknown, unknown, EditarReviewInput> = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await reviewService.editar(req.usuario!.id, id, req.body));
  } catch (err) {
    next(err);
  }
};

const eliminar: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    await reviewService.eliminar(req.usuario!.id, req.usuario!.rol, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Se monta en /api/peliculas — rutas /:id/reviews.
export const peliculaReviewsRouter = Router();
peliculaReviewsRouter.get('/:id/reviews', listar);
peliculaReviewsRouter.post('/:id/reviews', requireAuth, validateRequest(crearReviewSchema), crear);

// Se monta en /api/reviews — operaciones sobre una reseña puntual.
export const reviewRouter = Router();
reviewRouter.patch('/:id', requireAuth, validateRequest(editarReviewSchema), editar);
reviewRouter.delete('/:id', requireAuth, eliminar);
