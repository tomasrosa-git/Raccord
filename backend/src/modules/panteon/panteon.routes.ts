import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validateRequest, parsear } from '../../middlewares/validateRequest';
import {
  agregarAlPanteonSchema,
  setPeliculaFavoritaSchema,
  reordenarPanteonSchema,
} from './panteon.schema';
import { panteonService } from './panteon.service';
import type {
  AgregarAlPanteonInput,
  SetPeliculaFavoritaInput,
  ReordenarPanteonInput,
} from './panteon.schema';

const personaIdParams = z.object({ personaId: z.string().uuid() });

const listar: RequestHandler = async (req, res, next) => {
  try {
    res.json(await panteonService.listar(req.usuario!.id));
  } catch (err) {
    next(err);
  }
};

const agregar: RequestHandler<unknown, unknown, AgregarAlPanteonInput> = async (req, res, next) => {
  try {
    res.status(201).json(await panteonService.agregar(req.usuario!.id, req.body.personaId));
  } catch (err) {
    next(err);
  }
};

const quitar: RequestHandler = async (req, res, next) => {
  try {
    const { personaId } = parsear(personaIdParams, req.params);
    await panteonService.quitar(req.usuario!.id, personaId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const setPeliculaFavorita: RequestHandler<unknown, unknown, SetPeliculaFavoritaInput> = async (
  req,
  res,
  next
) => {
  try {
    const { personaId } = parsear(personaIdParams, req.params);
    res.json(
      await panteonService.setPeliculaFavorita(
        req.usuario!.id,
        personaId,
        req.body.peliculaFavoritaId
      )
    );
  } catch (err) {
    next(err);
  }
};

const reordenar: RequestHandler<unknown, unknown, ReordenarPanteonInput> = async (req, res, next) => {
  try {
    res.json(await panteonService.reordenar(req.usuario!.id, req.body.personaIds));
  } catch (err) {
    next(err);
  }
};

// Se monta en /api/panteon — el panteón del usuario autenticado.
export const panteonRouter = Router();
panteonRouter.get('/', requireAuth, listar);
panteonRouter.post('/', requireAuth, validateRequest(agregarAlPanteonSchema), agregar);
panteonRouter.put('/orden', requireAuth, validateRequest(reordenarPanteonSchema), reordenar);
panteonRouter.patch(
  '/:personaId',
  requireAuth,
  validateRequest(setPeliculaFavoritaSchema),
  setPeliculaFavorita
);
panteonRouter.delete('/:personaId', requireAuth, quitar);
