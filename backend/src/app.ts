import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './shared/errors/AppError';
import { authRouter } from './modules/usuario/auth.routes';
import { usuarioRouter } from './modules/usuario/usuario.routes';

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

// El resto de los routers de módulos se montan acá a medida que se implementan (Fases 3-5):
// app.use('/api/peliculas', peliculaRouter);
// ...

app.use((req, _res, next) => {
  next(AppError.notFound(`Ruta no encontrada: ${req.method} ${req.path}`));
});

app.use(errorHandler);
