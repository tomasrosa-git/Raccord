import type { RequestHandler } from 'express';
import { parsear } from '../../middlewares/validateRequest';
import { peliculaService } from './pelicula.service';
import { idParamsSchema, listarPeliculasQuerySchema } from './pelicula.schema';

export const listar: RequestHandler = async (req, res, next) => {
  try {
    const query = parsear(listarPeliculasQuerySchema, req.query);
    res.json(await peliculaService.listar(query));
  } catch (err) {
    next(err);
  }
};

export const facetas: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await peliculaService.obtenerFacetas());
  } catch (err) {
    next(err);
  }
};

export const porDecada: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await peliculaService.obtenerPorDecada());
  } catch (err) {
    next(err);
  }
};

export const detalle: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await peliculaService.obtenerDetalle(id));
  } catch (err) {
    next(err);
  }
};

export const similares: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await peliculaService.obtenerSimilares(id));
  } catch (err) {
    next(err);
  }
};

export const paleta: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await peliculaService.obtenerPaleta(id));
  } catch (err) {
    next(err);
  }
};

export const plataformas: RequestHandler = async (req, res, next) => {
  try {
    const { id } = parsear(idParamsSchema, req.params);
    res.json(await peliculaService.obtenerPlataformas(id));
  } catch (err) {
    next(err);
  }
};
