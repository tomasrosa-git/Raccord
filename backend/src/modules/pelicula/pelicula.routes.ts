import { Router } from 'express';
import { listar, porDecada, detalle, similares, paleta } from './pelicula.controller';

export const peliculaRouter = Router();

peliculaRouter.get('/', listar);
// Antes de /:id, si no Express toma "por-decada" como un id y falla la validación uuid.
peliculaRouter.get('/por-decada', porDecada);
peliculaRouter.get('/:id', detalle);
peliculaRouter.get('/:id/similares', similares);
peliculaRouter.get('/:id/paleta', paleta);
