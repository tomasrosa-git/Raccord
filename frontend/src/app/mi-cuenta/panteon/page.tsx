'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import type { EntradaPanteon, CreditoFilmografia } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Selector de la película favorita de un director (su filmografía como director). */
function PeliculaFavoritaSelect({
  entrada,
  onCambiar,
}: {
  entrada: EntradaPanteon;
  onCambiar: (peliculaId: string | null) => void;
}) {
  const [opciones, setOpciones] = useState<CreditoFilmografia[] | null>(null);

  useEffect(() => {
    let activo = true;
    void fetch(`${API_URL}/api/personas/${entrada.personaId}/filmografia?rol=DIRECTOR`)
      .then((res) => (res.ok ? res.json() : []))
      .then((datos: CreditoFilmografia[]) => {
        if (activo) setOpciones(datos);
      });
    return () => {
      activo = false;
    };
  }, [entrada.personaId]);

  return (
    <select
      value={entrada.peliculaFavoritaId ?? ''}
      onChange={(e) => onCambiar(e.target.value || null)}
      disabled={opciones === null}
      aria-label={`Película favorita de ${entrada.persona.nombre}`}
      className="w-full rounded-sm border border-borde bg-carbon px-2 py-1.5 text-sm text-papel focus:border-papel/40 focus:outline-none"
    >
      <option value="">Elegí su mejor película…</option>
      {opciones?.map((c) => (
        <option key={c.pelicula.id} value={c.pelicula.id}>
          {c.pelicula.titulo}
        </option>
      ))}
    </select>
  );
}

export default function EditorPanteon() {
  const { fetchAuth } = useAuth();
  const [panteon, setPanteon] = useState<EntradaPanteon[] | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetchAuth('/panteon');
    if (res.ok) setPanteon((await res.json()) as EntradaPanteon[]);
  }, [fetchAuth]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function quitar(personaId: string) {
    setPanteon((p) => p?.filter((e) => e.personaId !== personaId) ?? null); // optimista
    const res = await fetchAuth(`/panteon/${personaId}`, { method: 'DELETE' });
    if (!res.ok) await cargar(); // resync si falla
  }

  async function mover(indice: number, delta: number) {
    if (!panteon) return;
    const destino = indice + delta;
    if (destino < 0 || destino >= panteon.length) return;
    const nuevo = [...panteon];
    [nuevo[indice], nuevo[destino]] = [nuevo[destino], nuevo[indice]];
    setPanteon(nuevo); // optimista
    const res = await fetchAuth('/panteon/orden', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaIds: nuevo.map((e) => e.personaId) }),
    });
    if (!res.ok) await cargar();
  }

  async function setFavorita(personaId: string, peliculaFavoritaId: string | null) {
    const res = await fetchAuth(`/panteon/${personaId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peliculaFavoritaId }),
    });
    if (res.ok) {
      const actualizada = (await res.json()) as EntradaPanteon;
      setPanteon((p) =>
        p ? p.map((e) => (e.personaId === personaId ? actualizada : e)) : p
      );
    }
  }

  if (panteon === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <p className="max-w-2xl text-sm text-papel/60">
        Tu panteón es el centro de tu perfil público: tus directores, en orden, con la película
        favorita de cada uno. Sumá directores desde la ficha de cada{' '}
        <Link href="/directores" className="text-papel underline-offset-4 hover:underline">
          cineasta
        </Link>
        .
      </p>

      {panteon.length === 0 ? (
        <p className="mt-8 text-sm text-papel/40">
          Todavía no sumaste directores. Entrá a un{' '}
          <Link href="/directores" className="text-papel underline-offset-4 hover:underline">
            cineasta
          </Link>{' '}
          y tocá “Sumar al panteón”.
        </p>
      ) : (
        <ul className="mt-8 space-y-px bg-borde">
          {panteon.map((entrada, i) => (
            <li
              key={entrada.id}
              className="flex flex-col gap-4 bg-negro-sala p-4 sm:flex-row sm:items-center"
            >
              <span className="font-mono text-xs text-marca-cambio">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-full bg-carbon">
                {entrada.persona.fotoUrl && (
                  <Image
                    src={entrada.persona.fotoUrl}
                    alt={entrada.persona.nombre}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/cineasta/${entrada.persona.id}`}
                  className="text-sm text-papel/90 hover:text-papel"
                >
                  {entrada.persona.nombre}
                </Link>
                <div className="mt-2 max-w-xs">
                  <PeliculaFavoritaSelect
                    entrada={entrada}
                    onCambiar={(id) => void setFavorita(entrada.personaId, id)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 self-start sm:self-center">
                <button
                  onClick={() => void mover(i, -1)}
                  disabled={i === 0}
                  aria-label="Subir"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-sm border border-borde text-papel/60 hover:text-papel',
                    i === 0 && 'cursor-not-allowed opacity-30'
                  )}
                >
                  ↑
                </button>
                <button
                  onClick={() => void mover(i, 1)}
                  disabled={i === panteon.length - 1}
                  aria-label="Bajar"
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-sm border border-borde text-papel/60 hover:text-papel',
                    i === panteon.length - 1 && 'cursor-not-allowed opacity-30'
                  )}
                >
                  ↓
                </button>
                <button
                  onClick={() => void quitar(entrada.personaId)}
                  className="ml-1 font-mono text-xs text-papel/40 hover:text-terciopelo"
                >
                  quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
