import { Router } from 'express';
import type { RequestHandler } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { me } from './usuario.controller';
import { watchlistService, likesService } from '../watchlist/watchlist.service';
import { reviewService } from '../review/review.service';

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

export const usuarioRouter = Router();

usuarioRouter.get('/me', requireAuth, me);
usuarioRouter.get('/me/watchlist', requireAuth, miWatchlist);
usuarioRouter.get('/me/likes', requireAuth, misLikes);
usuarioRouter.get('/me/reviews', requireAuth, misReviews);
