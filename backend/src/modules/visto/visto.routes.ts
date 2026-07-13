import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parsear } from '../../middlewares/validateRequest';
import { vistoService } from './visto.service';

const peliculaIdParams = z.object({ peliculaId: z.string().uuid('peliculaId inválido') });

const agregar: RequestHandler = async (req, res, next) => {
  try {
    const { peliculaId } = parsear(peliculaIdParams, req.params);
    await vistoService.agregar(req.usuario!.id, peliculaId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const quitar: RequestHandler = async (req, res, next) => {
  try {
    const { peliculaId } = parsear(peliculaIdParams, req.params);
    await vistoService.quitar(req.usuario!.id, peliculaId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const vistoRouter = Router();
vistoRouter.use(requireAuth);
vistoRouter.post('/:peliculaId', agregar);
vistoRouter.delete('/:peliculaId', quitar);
