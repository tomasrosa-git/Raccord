'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Boton } from '@/components/ui/Boton';
import { cn } from '@/lib/utils/cn';

/** Toggles de watchlist, like y vista. El like usa terciopelo, según el sistema. */
export function AccionesPelicula({ peliculaId }: { peliculaId: string }) {
  const { usuario, cargando, fetchAuth } = useAuth();
  const [enWatchlist, setEnWatchlist] = useState(false);
  const [conLike, setConLike] = useState(false);
  const [vista, setVista] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    if (!usuario) {
      setListo(false);
      return;
    }
    let activo = true;
    void fetchAuth(`/peliculas/${peliculaId}/mi-estado`)
      .then((res) => (res.ok ? res.json() : null))
      .then((estado: { enWatchlist: boolean; conLike: boolean; vista: boolean } | null) => {
        if (activo && estado) {
          setEnWatchlist(estado.enWatchlist);
          setConLike(estado.conLike);
          setVista(estado.vista);
          setListo(true);
        }
      });
    return () => {
      activo = false;
    };
  }, [usuario, peliculaId, fetchAuth]);

  if (cargando) return null;

  if (!usuario) {
    return (
      <p className="text-sm text-papel/50">
        <Link href="/login" className="text-papel underline-offset-4 hover:underline">
          Ingresá
        </Link>{' '}
        para guardar en tu watchlist.
      </p>
    );
  }

  if (!listo) return null;

  async function toggle(
    recurso: 'watchlist' | 'likes' | 'vistas',
    activo: boolean,
    set: (v: boolean) => void
  ) {
    set(!activo); // optimista
    const res = await fetchAuth(`/${recurso}/${peliculaId}`, {
      method: activo ? 'DELETE' : 'POST',
    });
    if (!res.ok) set(activo); // rollback
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Boton
        onClick={() => void toggle('watchlist', enWatchlist, setEnWatchlist)}
        variante={enWatchlist ? 'primario' : 'secundario'}
      >
        {enWatchlist ? '✓ En tu watchlist' : '+ Watchlist'}
      </Boton>
      <Boton
        onClick={() => void toggle('likes', conLike, setConLike)}
        className={cn(conLike && 'border-terciopelo text-terciopelo')}
      >
        {conLike ? '♥ Te gusta' : '♡ Me gusta'}
      </Boton>
      <Boton
        onClick={() => void toggle('vistas', vista, setVista)}
        className={cn(vista && 'border-marca-cambio text-marca-cambio')}
      >
        {vista ? '✓ Vista' : '+ Vista'}
      </Boton>
    </div>
  );
}
