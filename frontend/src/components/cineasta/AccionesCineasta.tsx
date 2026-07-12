'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Boton } from '@/components/ui/Boton';
import { cn } from '@/lib/utils/cn';

/** Toggles de seguir director y sumarlo al panteón, en la ficha de cineasta. */
export function AccionesCineasta({ personaId }: { personaId: string }) {
  const { usuario, cargando, fetchAuth } = useAuth();
  const [siguiendo, setSiguiendo] = useState(false);
  const [enPanteon, setEnPanteon] = useState(false);
  const [listo, setListo] = useState(false);
  const [avisoPanteon, setAvisoPanteon] = useState<string | null>(null);

  useEffect(() => {
    if (!usuario) {
      setListo(false);
      return;
    }
    let activo = true;
    void fetchAuth(`/personas/${personaId}/mi-estado`)
      .then((res) => (res.ok ? res.json() : null))
      .then((estado: { siguiendo: boolean; enPanteon: boolean } | null) => {
        if (activo && estado) {
          setSiguiendo(estado.siguiendo);
          setEnPanteon(estado.enPanteon);
          setListo(true);
        }
      });
    return () => {
      activo = false;
    };
  }, [usuario, personaId, fetchAuth]);

  if (cargando) return null;

  if (!usuario) {
    return (
      <p className="text-sm text-papel/50">
        <Link href="/login" className="text-papel underline-offset-4 hover:underline">
          Ingresá
        </Link>{' '}
        para seguir a este director y sumarlo a tu panteón.
      </p>
    );
  }

  if (!listo) return null;

  async function toggleSeguir() {
    const antes = siguiendo;
    setSiguiendo(!antes); // optimista
    const res = await fetchAuth(`/personas/${personaId}/seguir`, {
      method: antes ? 'DELETE' : 'POST',
    });
    if (!res.ok) setSiguiendo(antes); // rollback
  }

  async function togglePanteon() {
    const antes = enPanteon;
    setAvisoPanteon(null);
    setEnPanteon(!antes); // optimista
    const res = await fetchAuth(
      antes ? `/panteon/${personaId}` : '/panteon',
      antes
        ? { method: 'DELETE' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ personaId }),
          }
    );
    if (!res.ok) {
      setEnPanteon(antes); // rollback
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      setAvisoPanteon(cuerpo?.error ?? 'No se pudo actualizar el panteón');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Boton
          onClick={() => void toggleSeguir()}
          variante={siguiendo ? 'primario' : 'secundario'}
        >
          {siguiendo ? '✓ Siguiendo' : '+ Seguir'}
        </Boton>
        <Boton
          onClick={() => void togglePanteon()}
          className={cn(enPanteon && 'border-terciopelo text-terciopelo')}
        >
          {enPanteon ? '★ En tu panteón' : '☆ Sumar al panteón'}
        </Boton>
      </div>
      {avisoPanteon && <p className="text-sm text-terciopelo">{avisoPanteon}</p>}
    </div>
  );
}
