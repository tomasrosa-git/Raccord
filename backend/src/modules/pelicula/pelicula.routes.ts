import { Router } from 'express';
import {
  listar,
  facetas,
  porDecada,
  detalle,
  similares,
  paleta,
  plataformas,
} from './pelicula.controller';

export const peliculaRouter = Router();

peliculaRouter.get('/', listar);
// Antes de /:id, si no Express toma estas rutas como un id y falla la validación uuid.
peliculaRouter.get('/facetas', facetas);
peliculaRouter.get('/por-decada', porDecada);
peliculaRouter.get('/:id', detalle);
peliculaRouter.get('/:id/similares', similares);
peliculaRouter.get('/:id/paleta', paleta);
peliculaRouter.get('/:id/plataformas', plataformas);
