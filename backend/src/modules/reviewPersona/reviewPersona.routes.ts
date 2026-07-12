import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validateRequest, parsear } from '../../middlewares/validateRequest';
import { idParamsSchema } from '../persona/persona.schema';
import { crearReviewPersonaSchema, editarReviewPersonaSchema } from './reviewPersona.schema';
import { reviewPersonaService } from './reviewPersona.service';
import type { CrearReviewPersonaInput, EditarReviewPersonaInput } from './reviewPersona.schema';

const listar: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await reviewPersonaService.listarDePersona(id));
  } catch (err) {
    next(err);
  }
};

const crear: RequestHandler<unknown, unknown, CrearReviewPersonaInput> = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.status(201).json(await reviewPersonaService.crear(req.usuario!.id, id, req.body));
  } catch (err) {
    next(err);
  }
};

const editar: RequestHandler<unknown, unknown, EditarReviewPersonaInput> = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await reviewPersonaService.editar(req.usuario!.id, id, req.body));
  } catch (err) {
    next(err);
  }
};

const eliminar: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    await reviewPersonaService.eliminar(req.usuario!.id, req.usuario!.rol, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Se monta en /api/personas — rutas /:id/reviews.
export const personaReviewsRouter = Router();
personaReviewsRouter.get('/:id/reviews', listar);
personaReviewsRouter.post('/:id/reviews', requireAuth, validateRequest(crearReviewPersonaSchema), crear);

// Se monta en /api/reviews-persona — operaciones sobre una reseña puntual.
export const reviewPersonaRouter = Router();
reviewPersonaRouter.patch('/:id', requireAuth, validateRequest(editarReviewPersonaSchema), editar);
reviewPersonaRouter.delete('/:id', requireAuth, eliminar);
