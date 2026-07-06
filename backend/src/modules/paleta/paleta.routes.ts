import { Router } from 'express';
import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import { idParamsSchema } from '../persona/persona.schema';
import { paletaService } from './paleta.service';

const firmaVisual: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await paletaService.obtenerFirmaVisual(id));
  } catch (err) {
    next(err);
  }
};

// Se monta en /api/personas — la ruta completa es /api/personas/:id/firma-visual.
export const paletaRouter = Router();
paletaRouter.get('/:id/firma-visual', firmaVisual);
