'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Boton } from '@/components/ui/Boton';
import { cn } from '@/lib/utils/cn';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface Review {
  id: string;
  texto: string;
  puntuacion: number;
  contieneSpoiler: boolean;
  createdAt: string;
  usuario: { id: string; username: string; avatarUrl: string | null };
}

function Estrellas({ puntuacion, className }: { puntuacion: number; className?: string }) {
  return (
    <span className={cn('font-mono text-sm text-terciopelo', className)} aria-label={`${puntuacion} de 5`}>
      {'★'.repeat(puntuacion)}
      <span className="text-papel/20">{'★'.repeat(5 - puntuacion)}</span>
    </span>
  );
}

function TarjetaReview({
  review,
  esPropia,
  onEliminar,
}: {
  review: Review;
  esPropia: boolean;
  onEliminar: () => void;
}) {
  const [mostrarSpoiler, setMostrarSpoiler] = useState(false);
  const oculto = review.contieneSpoiler && !mostrarSpoiler;

  return (
    <li className="border-b border-borde py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-papel/90">@{review.usuario.username}</span>
        <Estrellas puntuacion={review.puntuacion} />
        <span className="font-mono text-xs text-papel/40">
          {new Date(review.createdAt).toLocaleDateString('es-AR')}
        </span>
        {esPropia && (
          <button
            onClick={onEliminar}
            className="ml-auto cursor-pointer font-mono text-xs text-papel/40 hover:text-terciopelo"
          >
            eliminar
          </button>
        )}
      </div>
      {oculto ? (
        <button
          onClick={() => setMostrarSpoiler(true)}
          className="mt-3 cursor-pointer rounded-sm border border-terciopelo/50 px-3 py-1.5 font-mono text-xs text-terciopelo hover:border-terciopelo"
        >
          Contiene spoilers — mostrar igual
        </button>
      ) : (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-papel/80">{review.texto}</p>
      )}
    </li>
  );
}

export function Reviews({ peliculaId }: { peliculaId: string }) {
  const { usuario, fetchAuth } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [texto, setTexto] = useState('');
  const [puntuacion, setPuntuacion] = useState(4);
  const [contieneSpoiler, setContieneSpoiler] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/peliculas/${peliculaId}/reviews`);
    if (res.ok) setReviews((await res.json()) as Review[]);
  }, [peliculaId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const propia = usuario ? reviews.find((r) => r.usuario.id === usuario.id) : undefined;

  async function publicar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const res = await fetchAuth(`/peliculas/${peliculaId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto, puntuacion, contieneSpoiler }),
    });
    setEnviando(false);
    if (!res.ok) {
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(cuerpo?.error ?? 'No se pudo publicar la reseña');
      return;
    }
    setTexto('');
    setContieneSpoiler(false);
    await cargar();
  }

  async function eliminar(reviewId: string) {
    const res = await fetchAuth(`/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) await cargar();
  }

  return (
    <section>
      <EtiquetaSeccion>Reseñas</EtiquetaSeccion>

      {usuario && !propia && (
        <form onSubmit={publicar} className="mt-6 max-w-2xl space-y-3">
          <div className="flex items-center gap-4">
            <label className="font-mono text-xs uppercase tracking-wider text-papel/50">
              Puntuación
            </label>
            <div className="flex gap-1" role="radiogroup" aria-label="Puntuación">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={puntuacion === n}
                  onClick={() => setPuntuacion(n)}
                  className={cn(
                    'cursor-pointer text-xl transition-colors',
                    n <= puntuacion ? 'text-terciopelo' : 'text-papel/20 hover:text-papel/40'
                  )}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Qué te dejó la película…"
            rows={4}
            required
            maxLength={5000}
            className="w-full rounded-sm border border-borde bg-carbon px-3 py-2 text-sm text-papel placeholder:text-papel/40 focus:border-papel/40 focus:outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-papel/60">
              <input
                type="checkbox"
                checked={contieneSpoiler}
                onChange={(e) => setContieneSpoiler(e.target.checked)}
                className="accent-terciopelo"
              />
              Contiene spoilers
            </label>
            <Boton type="submit" variante="primario" disabled={enviando || texto.length === 0}>
              {enviando ? 'Publicando…' : 'Publicar reseña'}
            </Boton>
          </div>
          {error && <p className="text-sm text-terciopelo">{error}</p>}
        </form>
      )}

      {!usuario && (
        <p className="mt-6 text-sm text-papel/50">
          <Link href="/login" className="text-papel underline-offset-4 hover:underline">
            Ingresá
          </Link>{' '}
          para escribir una reseña.
        </p>
      )}

      {reviews.length > 0 ? (
        <ul className="mt-8">
          {reviews.map((r) => (
            <TarjetaReview
              key={r.id}
              review={r}
              esPropia={usuario?.id === r.usuario.id}
              onEliminar={() => void eliminar(r.id)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-papel/40">Todavía no hay reseñas. Sé la primera voz.</p>
      )}
    </section>
  );
}
