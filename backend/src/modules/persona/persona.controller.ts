import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import { personaService } from './persona.service';
import { idParamsSchema, filmografiaQuerySchema } from './persona.schema';

export const listarDirectores: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await personaService.listarDirectores());
  } catch (err) {
    next(err);
  }
};

export const detalle: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await personaService.obtenerDetalle(id));
  } catch (err) {
    next(err);
  }
};

export const filmografia: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    const query = parsear(filmografiaQuerySchema, req.query);
    res.json(await personaService.obtenerFilmografia(id, query));
  } catch (err) {
    next(err);
  }
};

export const premios: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await personaService.obtenerPremios(id));
  } catch (err) {
    next(err);
  }
};

export const etapasCarrera: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await personaService.obtenerEtapasCarrera(id));
  } catch (err) {
    next(err);
  }
};

export const seguir: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    await personaService.seguir(req.usuario!.id, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const dejarDeSeguir: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    await personaService.dejarDeSeguir(req.usuario!.id, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
