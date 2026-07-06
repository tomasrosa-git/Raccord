import NodeCache from 'node-cache';

// Cache en memoria para queries agregadas pesadas. A esta escala no se
// justifica Redis; si el proceso se reinicia, se recalcula.
const cache = new NodeCache({ useClones: false });

export async function conCache<T>(clave: string, ttlSegundos: number, fn: () => Promise<T>): Promise<T> {
  const cacheado = cache.get<T>(clave);
  if (cacheado !== undefined) return cacheado;

  const valor = await fn();
  cache.set(clave, valor, ttlSegundos);
  return valor;
}

export function invalidarCache(prefijo: string) {
  const claves = cache.keys().filter((k) => k.startsWith(prefijo));
  cache.del(claves);
}
