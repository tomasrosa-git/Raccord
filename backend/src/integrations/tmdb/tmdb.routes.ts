import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth, requireAdmin } from '../../middlewares/auth.middleware';
import { AppError } from '../../shared/errors/AppError';
import { tmdbSyncService } from './tmdb.sync.service';

function parseTmdbId(raw: string | string[] | undefined): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw AppError.badRequest('tmdbId inválido');
  }
  return id;
}

const syncPelicula: RequestHandler = async (req, res, next) => {
  try {
    const pelicula = await tmdbSyncService.syncPelicula(parseTmdbId(req.params.tmdbId));
    res.json({ sincronizada: pelicula.titulo, id: pelicula.id });
  } catch (err) {
    next(err);
  }
};

const syncPersona: RequestHandler = async (req, res, next) => {
  try {
    const resultado = await tmdbSyncService.syncPersona(parseTmdbId(req.params.tmdbId));
    res.json({
      sincronizada: resultado.persona.nombre,
      id: resultado.persona.id,
      peliculasSincronizadas: resultado.peliculasSincronizadas,
      peliculasFallidas: resultado.peliculasFallidas,
    });
  } catch (err) {
    next(err);
  }
};

export const tmdbSyncRouter = Router();

tmdbSyncRouter.use(requireAuth, requireAdmin);
tmdbSyncRouter.post('/pelicula/:tmdbId', syncPelicula);
tmdbSyncRouter.post('/persona/:tmdbId', syncPersona);
