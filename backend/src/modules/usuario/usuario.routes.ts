import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { me } from './usuario.controller';

export const usuarioRouter = Router();

usuarioRouter.get('/me', requireAuth, me);
