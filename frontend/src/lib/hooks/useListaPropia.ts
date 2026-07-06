'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

/** Carga una lista del usuario autenticado (watchlist, likes, reviews). */
export function useListaPropia<T>(path: string) {
  const { usuario, fetchAuth } = useAuth();
  const [items, setItems] = useState<T[] | null>(null);

  useEffect(() => {
    if (!usuario) return;
    let activo = true;
    void fetchAuth(path)
      .then((res) => (res.ok ? res.json() : []))
      .then((datos: T[]) => {
        if (activo) setItems(datos);
      });
    return () => {
      activo = false;
    };
  }, [usuario, path, fetchAuth]);

  return { items, cargando: items === null };
}
