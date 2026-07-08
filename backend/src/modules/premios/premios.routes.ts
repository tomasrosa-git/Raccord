import { Router } from 'express';
import { ganadores } from './premios.controller';

export const premioRouter = Router();

premioRouter.get('/:id/ganadores', ganadores);
