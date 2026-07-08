import { AppError } from '../../shared/errors/AppError';
import { premioRepository } from './premios.repository';

export const premioService = {
  async obtenerGanadores(id: string) {
    const premio = await premioRepository.buscarConGanadores(id);
    if (!premio) throw AppError.notFound('Premio no encontrado');

    const { ganados, ...datos } = premio;
    return { ...datos, ganadores: ganados };
  },
};
