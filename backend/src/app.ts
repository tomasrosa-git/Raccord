import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/errors/AppError';
import { authRouter } from './modules/usuario/auth.routes';
import { usuarioRouter } from './modules/usuario/usuario.routes';
import { tmdbSyncRouter } from './integrations/tmdb/tmdb.routes';
import { peliculaRouter } from './modules/pelicula/pelicula.routes';
import { personaRouter } from './modules/persona/persona.routes';
import { colaboradoresRouter } from './modules/colaboradores/colaboradores.routes';
import { paletaRouter } from './modules/paleta/paleta.routes';
import { peliculaReviewsRouter, reviewRouter } from './modules/review/review.routes';
import { watchlistRouter, likesRouter, miEstadoPelicula } from './modules/watchlist/watchlist.routes';
import { requireAuth } from './middlewares/auth.middleware';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/admin/sync/tmdb', tmdbSyncRouter);
app.use('/api/peliculas', peliculaReviewsRouter);
app.get('/api/peliculas/:peliculaId/mi-estado', requireAuth, miEstadoPelicula);
app.use('/api/peliculas', peliculaRouter);
app.use('/api/personas', colaboradoresRouter);
app.use('/api/personas', paletaRouter);
app.use('/api/personas', personaRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/likes', likesRouter);

// Pendiente (carga manual de datos): /api/premios/:id/ganadores.

app.use((req, _res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.path}`));
});

app.use(errorHandler);
