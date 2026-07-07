import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  listarDirectores,
  detalle,
  filmografia,
  premios,
  etapasCarrera,
  seguir,
  dejarDeSeguir,
} from './persona.controller';

export const personaRouter = Router();

// Antes de /:id, si no Express toma "directores" como un id y falla la validación uuid.
personaRouter.get('/directores', listarDirectores);
personaRouter.get('/:id', detalle);
personaRouter.get('/:id/filmografia', filmografia);
personaRouter.get('/:id/premios', premios);
personaRouter.get('/:id/etapas-carrera', etapasCarrera);
personaRouter.post('/:id/seguir', requireAuth, seguir);
personaRouter.delete('/:id/seguir', requireAuth, dejarDeSeguir);
