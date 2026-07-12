'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Boton } from '@/components/ui/Boton';
import { EstrellasDisplay, EstrellasInput } from '@/components/ui/Estrellas';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Review {
  id: string;
  texto: string;
  puntuacion: number; // 1..10 (medias estrellas)
  contieneSpoiler: boolean;
  createdAt: string;
  usuario: { id: string; username: string; avatarUrl: string | null };
}

interface Props {
  /** Etiqueta de la sección: "Reseñas" o "Reseñas de su obra". */
  titulo: string;
  /** Ruta base del recurso para listar/crear: `/peliculas/:id` o `/personas/:id`. */
  recursoPath: string;
  /** Ruta para editar/borrar una reseña puntual: `/reviews` o `/reviews-persona`. */
  reviewPath: string;
  placeholder: string;
  promptVacio: string;
}

/** Datos comunes del formulario, para crear y editar. */
interface Borrador {
  texto: string;
  puntuacion: number;
  contieneSpoiler: boolean;
}

function FormularioReview({
  inicial,
  placeholder,
  enviando,
  error,
  textoBoton,
  onSubmit,
  onCancelar,
}: {
  inicial: Borrador;
  placeholder: string;
  enviando: boolean;
  error: string | null;
  textoBoton: string;
  onSubmit: (b: Borrador) => void;
  onCancelar?: () => void;
}) {
  const [texto, setTexto] = useState(inicial.texto);
  const [puntuacion, setPuntuacion] = useState(inicial.puntuacion);
  const [contieneSpoiler, setContieneSpoiler] = useState(inicial.contieneSpoiler);

  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit({ texto, puntuacion, contieneSpoiler });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-3">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs uppercase tracking-wider text-papel/50">Puntuación</span>
        <EstrellasInput valor={puntuacion} onChange={setPuntuacion} />
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label="Texto de la reseña"
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
        <div className="flex items-center gap-2">
          {onCancelar && (
            <Boton type="button" variante="secundario" onClick={onCancelar}>
              Cancelar
            </Boton>
          )}
          <Boton type="submit" variante="primario" disabled={enviando || texto.length === 0}>
            {enviando ? 'Guardando…' : textoBoton}
          </Boton>
        </div>
      </div>
      {error && <p className="text-sm text-terciopelo">{error}</p>}
    </form>
  );
}

function TarjetaReview({
  review,
  esPropia,
  onEditar,
  onEliminar,
}: {
  review: Review;
  esPropia: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [mostrarSpoiler, setMostrarSpoiler] = useState(false);
  const oculto = review.contieneSpoiler && !mostrarSpoiler;

  return (
    <li className="border-b border-borde py-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-sm text-papel/90">@{review.usuario.username}</span>
        <EstrellasDisplay puntuacion={review.puntuacion} className="text-sm" />
        <span className="font-mono text-xs text-papel/40">
          {new Date(review.createdAt).toLocaleDateString('es-AR')}
        </span>
        {esPropia && (
          <span className="ml-auto flex gap-3">
            <button
              onClick={onEditar}
              className="cursor-pointer font-mono text-xs text-papel/40 hover:text-papel"
            >
              editar
            </button>
            <button
              onClick={onEliminar}
              className="cursor-pointer font-mono text-xs text-papel/40 hover:text-terciopelo"
            >
              eliminar
            </button>
          </span>
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
        <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-papel/80">
          {review.texto}
        </p>
      )}
    </li>
  );
}

export function ListaReviews({ titulo, recursoPath, reviewPath, placeholder, promptVacio }: Props) {
  const { usuario, fetchAuth } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [editando, setEditando] = useState(false);

  const cargar = useCallback(async () => {
    const res = await fetch(`${API_URL}/api${recursoPath}/reviews`);
    if (res.ok) setReviews((await res.json()) as Review[]);
  }, [recursoPath]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const propia = usuario ? reviews.find((r) => r.usuario.id === usuario.id) : undefined;

  async function crear(b: Borrador) {
    setError(null);
    setEnviando(true);
    const res = await fetchAuth(`${recursoPath}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    });
    setEnviando(false);
    if (!res.ok) {
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(cuerpo?.error ?? 'No se pudo publicar la reseña');
      return;
    }
    await cargar();
  }

  async function editar(b: Borrador) {
    if (!propia) return;
    setError(null);
    setEnviando(true);
    const res = await fetchAuth(`${reviewPath}/${propia.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    });
    setEnviando(false);
    if (!res.ok) {
      const cuerpo = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(cuerpo?.error ?? 'No se pudo editar la reseña');
      return;
    }
    setEditando(false);
    await cargar();
  }

  async function eliminar(reviewId: string) {
    const res = await fetchAuth(`${reviewPath}/${reviewId}`, { method: 'DELETE' });
    if (res.ok) {
      setEditando(false);
      await cargar();
    }
  }

  const resto = propia ? reviews.filter((r) => r.id !== propia.id) : reviews;

  return (
    <section>
      <EtiquetaSeccion>{titulo}</EtiquetaSeccion>

      {usuario && !propia && (
        <div className="mt-6">
          <FormularioReview
            inicial={{ texto: '', puntuacion: 8, contieneSpoiler: false }}
            placeholder={placeholder}
            enviando={enviando}
            error={error}
            textoBoton="Publicar reseña"
            onSubmit={crear}
          />
        </div>
      )}

      {!usuario && (
        <p className="mt-6 text-sm text-papel/50">
          <Link href="/login" className="text-papel underline-offset-4 hover:underline">
            Ingresá
          </Link>{' '}
          para escribir una reseña.
        </p>
      )}

      <ul className="mt-8">
        {propia && (
          <li className="border-b border-borde py-5">
            {editando ? (
              <FormularioReview
                inicial={{
                  texto: propia.texto,
                  puntuacion: propia.puntuacion,
                  contieneSpoiler: propia.contieneSpoiler,
                }}
                placeholder={placeholder}
                enviando={enviando}
                error={error}
                textoBoton="Guardar cambios"
                onSubmit={editar}
                onCancelar={() => {
                  setEditando(false);
                  setError(null);
                }}
              />
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-sm text-papel/90">@{propia.usuario.username}</span>
                <EstrellasDisplay puntuacion={propia.puntuacion} className="text-sm" />
                <span className="font-mono text-xs text-marca-cambio">· tu reseña</span>
                <span className="ml-auto flex gap-3">
                  <button
                    onClick={() => setEditando(true)}
                    className="cursor-pointer font-mono text-xs text-papel/40 hover:text-papel"
                  >
                    editar
                  </button>
                  <button
                    onClick={() => void eliminar(propia.id)}
                    className="cursor-pointer font-mono text-xs text-papel/40 hover:text-terciopelo"
                  >
                    eliminar
                  </button>
                </span>
                {propia.contieneSpoiler && (
                  <p className="w-full font-mono text-xs text-terciopelo/70">contiene spoilers</p>
                )}
                <p className="mt-2 w-full max-w-2xl whitespace-pre-line text-sm leading-relaxed text-papel/80">
                  {propia.texto}
                </p>
              </div>
            )}
          </li>
        )}

        {resto.map((r) => (
          <TarjetaReview
            key={r.id}
            review={r}
            esPropia={false}
            onEditar={() => {}}
            onEliminar={() => {}}
          />
        ))}
      </ul>

      {reviews.length === 0 && <p className="mt-8 text-sm text-papel/40">{promptVacio}</p>}
    </section>
  );
}
