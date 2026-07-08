import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import { idParamsSchema } from './premios.schema';
import { premioService } from './premios.service';

export const ganadores: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await premioService.obtenerGanadores(id));
  } catch (err) {
    next(err);
  }
};
