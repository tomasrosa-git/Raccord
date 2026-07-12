import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { parsear } from '../../middlewares/validateRequest';
import { z } from 'zod';
import { me } from './usuario.controller';
import { watchlistService, likesService } from '../watchlist/watchlist.service';
import { reviewService } from '../review/review.service';
import { reviewPersonaService } from '../reviewPersona/reviewPersona.service';
import { panteonService } from '../panteon/panteon.service';

const miWatchlist: RequestHandler = async (req, res, next) => {
  try {
    res.json(await watchlistService.listar(req.usuario!.id));
  } catch (err) {
    next(err);
  }
};

const misLikes: RequestHandler = async (req, res, next) => {
  try {
    res.json(await likesService.listar(req.usuario!.id));
  } catch (err) {
    next(err);
  }
};

const misReviews: RequestHandler = async (req, res, next) => {
  try {
    res.json(await reviewService.listarDeUsuario(req.usuario!.id));
  } catch (err) {
    next(err);
  }
};

const misReviewsPersona: RequestHandler = async (req, res, next) => {
  try {
    res.json(await reviewPersonaService.listarDeUsuario(req.usuario!.id));
  } catch (err) {
    next(err);
  }
};

const usernameParams = z.object({
  username: z.string().min(1).max(50),
});

const perfilPublico: RequestHandler = async (req, res, next) => {
  try {
    const { username } = parsear(usernameParams, req.params);
    res.json(await panteonService.perfilPublico(username));
  } catch (err) {
    next(err);
  }
};

export const usuarioRouter = Router();

usuarioRouter.get('/me', requireAuth, me);
usuarioRouter.get('/me/watchlist', requireAuth, miWatchlist);
usuarioRouter.get('/me/likes', requireAuth, misLikes);
usuarioRouter.get('/me/reviews', requireAuth, misReviews);
usuarioRouter.get('/me/reviews-persona', requireAuth, misReviewsPersona);
// Perfil público: después de las rutas /me para que "me" no matchee :username.
usuarioRouter.get('/:username/perfil', perfilPublico);
