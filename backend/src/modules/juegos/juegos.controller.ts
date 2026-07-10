import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import { intentoBodySchema, dueloBodySchema } from './juegos.schema';
import { juegosService, duelo } from './juegos.service';

export const frameGuessHoy: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await juegosService.frameGuessDeHoy());
  } catch (err) {
    next(err);
  }
};

export const frameGuessIntentar: RequestHandler = async (req, res, next) => {
  try {
    const { peliculaId } = parsear(intentoBodySchema, req.body);
    res.json(await juegosService.frameGuessIntentar(peliculaId));
  } catch (err) {
    next(err);
  }
};

export const frameGuessSolucion: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await juegosService.frameGuessSolucion());
  } catch (err) {
    next(err);
  }
};

export const dueloRonda: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await duelo.nuevaRonda());
  } catch (err) {
    next(err);
  }
};

export const dueloResolver: RequestHandler = async (req, res, next) => {
  try {
    const { aId, bId, elegidaId } = parsear(dueloBodySchema, req.body);
    res.json(await duelo.resolver(aId, bId, elegidaId));
  } catch (err) {
    next(err);
  }
};
