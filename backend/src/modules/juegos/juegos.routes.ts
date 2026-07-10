import { Router } from 'express';
import {
  frameGuessHoy,
  frameGuessIntentar,
  frameGuessSolucion,
  dueloRonda,
  dueloResolver,
  intrusoRonda,
  intrusoResolver,
} from './juegos.controller';

export const juegosRouter = Router();

juegosRouter.get('/frame-guess/hoy', frameGuessHoy);
juegosRouter.post('/frame-guess/intentar', frameGuessIntentar);
juegosRouter.post('/frame-guess/solucion', frameGuessSolucion);

juegosRouter.get('/duelo/ronda', dueloRonda);
juegosRouter.post('/duelo/resolver', dueloResolver);

juegosRouter.get('/intruso/ronda', intrusoRonda);
juegosRouter.post('/intruso/resolver', intrusoResolver);
