import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginRateLimiter } from '../../middlewares/rateLimiter';
import { registroSchema, loginSchema } from './usuario.schema';
import { registro, login, refresh, logout } from './auth.controller';

export const authRouter = Router();

authRouter.post('/registro', validateRequest(registroSchema), registro);
authRouter.post('/login', loginRateLimiter, validateRequest(loginSchema), login);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
