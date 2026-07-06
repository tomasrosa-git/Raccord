import { Router } from 'express';
import { listar, detalle, similares, paleta } from './pelicula.controller';

export const peliculaRouter = Router();

peliculaRouter.get('/', listar);
peliculaRouter.get('/:id', detalle);
peliculaRouter.get('/:id/similares', similares);
peliculaRouter.get('/:id/paleta', paleta);
