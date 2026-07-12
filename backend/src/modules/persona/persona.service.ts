import { AppError } from '../../shared/errors/AppError';
import { personaRepository } from './persona.repository';
import type { FilmografiaQuery } from './persona.schema';

async function asegurarQueExiste(personaId: string) {
  const existe = await personaRepository.existe(personaId);
  if (!existe) throw AppError.notFound('Persona no encontrada');
}

export const personaService = {
  listarDirectores() {
    return personaRepository.listarDirectores();
  },

  async obtenerDetalle(id: string) {
    const persona = await personaRepository.buscarPorId(id);
    if (!persona) throw AppError.notFound('Persona no encontrada');

    const { estilos, ...datos } = persona;
    return { ...datos, estilos: estilos.map((e) => e.tag) };
  },

  async obtenerFilmografia(id: string, query: FilmografiaQuery) {
    await asegurarQueExiste(id);
    return personaRepository.buscarFilmografia(id, query.rol);
  },

  async obtenerPremios(id: string) {
    await asegurarQueExiste(id);
    return personaRepository.buscarPremios(id);
  },

  async obtenerEtapasCarrera(id: string) {
    await asegurarQueExiste(id);
    return personaRepository.buscarEtapasCarrera(id);
  },

  async seguir(usuarioId: string, personaId: string) {
    await asegurarQueExiste(personaId);
    await personaRepository.seguir(usuarioId, personaId);
  },

  async dejarDeSeguir(usuarioId: string, personaId: string) {
    await personaRepository.dejarDeSeguir(usuarioId, personaId);
  },

  async miEstado(usuarioId: string, personaId: string) {
    const [siguiendo, enPanteon] = await Promise.all([
      personaRepository.estaSiguiendo(usuarioId, personaId),
      personaRepository.estaEnPanteon(usuarioId, personaId),
    ]);
    return { siguiendo, enPanteon };
  },
};
