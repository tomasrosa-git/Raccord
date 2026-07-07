import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { parsear } from '../../middlewares/validateRequest';
import { busquedaService } from './busqueda.service';

const buscarQuerySchema = z.object({
  q: z.string().trim().min(1, 'Falta el término de búsqueda').max(100),
});

const buscar: RequestHandler = async (req, res, next) => {
  try {
    const { q } = parsear(buscarQuerySchema, req.query);
    res.json(await busquedaService.buscar(q));
  } catch (err) {
    next(err);
  }
};

export const busquedaRouter = Router();
busquedaRouter.get('/', buscar);
