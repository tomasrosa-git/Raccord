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
app.use('/api/peliculas', peliculaRouter);
app.use('/api/personas', personaRouter);

// Pendientes (Fase 5+): colaboradores, firma-visual, reviews, watchlist, likes, premios.

app.use((req, _res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.path}`));
});

app.use(errorHandler);
