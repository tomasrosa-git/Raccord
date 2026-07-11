import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginRateLimiter } from '../../middlewares/rateLimiter';
import { registroSchema, loginSchema, googleSchema } from './usuario.schema';
import { registro, login, google, refresh, logout } from './auth.controller';

export const authRouter = Router();

authRouter.post('/registro', validateRequest(registroSchema), registro);
authRouter.post('/login', loginRateLimiter, validateRequest(loginSchema), login);
authRouter.post('/google', loginRateLimiter, validateRequest(googleSchema), google);
authRouter.post('/refresh', refresh);
authRouter.post('/logout', logout);
