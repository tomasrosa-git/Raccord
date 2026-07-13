import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import {
  intentoBodySchema,
  dueloBodySchema,
  dueloSiguienteQuerySchema,
  intrusoBodySchema,
} from './juegos.schema';
import { juegosService, duelo, dueloTaquilla, intruso } from './juegos.service';

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

export const dueloSiguiente: RequestHandler = async (req, res, next) => {
  try {
    const { conservarId } = parsear(dueloSiguienteQuerySchema, req.query);
    res.json(await duelo.siguienteRonda(conservarId));
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

export const dueloTaquillaRonda: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await dueloTaquilla.nuevaRonda());
  } catch (err) {
    next(err);
  }
};

export const dueloTaquillaSiguiente: RequestHandler = async (req, res, next) => {
  try {
    const { conservarId } = parsear(dueloSiguienteQuerySchema, req.query);
    res.json(await dueloTaquilla.siguienteRonda(conservarId));
  } catch (err) {
    next(err);
  }
};

export const dueloTaquillaResolver: RequestHandler = async (req, res, next) => {
  try {
    const { aId, bId, elegidaId } = parsear(dueloBodySchema, req.body);
    res.json(await dueloTaquilla.resolver(aId, bId, elegidaId));
  } catch (err) {
    next(err);
  }
};

export const intrusoRonda: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await intruso.nuevaRonda());
  } catch (err) {
    next(err);
  }
};

export const intrusoResolver: RequestHandler = async (req, res, next) => {
  try {
    const { ids, categoria, elegidaId } = parsear(intrusoBodySchema, req.body);
    res.json(await intruso.resolver(ids, categoria, elegidaId));
  } catch (err) {
    next(err);
  }
};
