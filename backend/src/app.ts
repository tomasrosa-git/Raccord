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
import { busquedaRouter } from './modules/busqueda/busqueda.routes';
import { statsRouter } from './modules/stats/stats.routes';
import { premioRouter } from './modules/premios/premios.routes';
import { requireAuth } from './middlewares/auth.middleware';

export const app = express();

// Render (y cualquier PaaS) pone un proxy adelante: sin esto el rate limiter
// vería la IP del proxy para todos los requests y `secure` en cookies fallaría.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    // Admite varios orígenes separados por coma (ej: producción + localhost).
    origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/buscar', busquedaRouter);
app.use('/api/stats', statsRouter);
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
app.use('/api/premios', premioRouter);

app.use((req, _res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.path}`));
});

app.use(errorHandler);
