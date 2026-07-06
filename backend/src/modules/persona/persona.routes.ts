import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  detalle,
  filmografia,
  premios,
  etapasCarrera,
  seguir,
  dejarDeSeguir,
} from './persona.controller';

export const personaRouter = Router();

personaRouter.get('/:id', detalle);
personaRouter.get('/:id/filmografia', filmografia);
personaRouter.get('/:id/premios', premios);
personaRouter.get('/:id/etapas-carrera', etapasCarrera);
personaRouter.post('/:id/seguir', requireAuth, seguir);
personaRouter.delete('/:id/seguir', requireAuth, dejarDeSeguir);
