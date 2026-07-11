import { Router } from 'express';
import type { RequestHandler } from 'express';
import { conCache } from '../../shared/utils/cache';
import { obtenerNovedades } from './novedades.service';

// Media hora: "tiempo real" a escala de cartelera, sin castigar a TMDB
// (cada refresco son ~17 requests: 3 listados + videos de las candidatas).
const TTL_SEGUNDOS = 1800;

const obtener: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await conCache('novedades', TTL_SEGUNDOS, obtenerNovedades));
  } catch (err) {
    next(err);
  }
};

export const novedadesRouter = Router();
novedadesRouter.get('/', obtener);
