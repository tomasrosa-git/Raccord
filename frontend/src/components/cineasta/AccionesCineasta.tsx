'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Boton } from '@/components/ui/Boton';
import { cn } from '@/lib/utils/cn';

interface Progreso {
  vistas: number;
  total: number;
}

/** Barra de progreso del completista: cuántas de sus películas ya viste. */
function BarraProgreso({ progreso }: { progreso: Progreso }) {
  if (progreso.total === 0) return null;
  const pct = Math.round((progreso.vistas / progreso.total) * 100);
  const completo = progreso.vistas === progreso.total;

  return (
    <div className="max-w-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs text-papel/50">
          Viste {progreso.vistas} de {progreso.total} películas
        </p>
        {completo && (
          <span className="font-mono text-xs uppercase tracking-wider text-marca-cambio">
            ★ Completista
          </span>
        )}
      </div>
      <div className="mt-1.5 h-1 w-full bg-borde">
        <div
          className={cn('h-full', completo ? 'bg-marca-cambio' : 'bg-papel/40')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Toggles de seguir director y sumarlo al panteón, en la ficha de cineasta. */
export function AccionesCineasta({ personaId }: { personaId: string }) {
  const { usuario, cargando, fetchAuth } = useAuth();
  const [siguiendo, setSiguiendo] = useState(false);
  const [enPanteon, setEnPanteon] = useState(false);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
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
      .then((estado: { siguiendo: boolean; enPanteon: boolean; progreso: Progreso } | null) => {
        if (activo && estado) {
          setSiguiendo(estado.siguiendo);
          setEnPanteon(estado.enPanteon);
          setProgreso(estado.progreso);
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
      {progreso && <BarraProgreso progreso={progreso} />}
    </div>
  );
}
