'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Boton } from '@/components/ui/Boton';
import { BotonGoogle, googleHabilitado } from '@/components/auth/BotonGoogle';

export default function PaginaRegistro() {
  const { registro } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const onGoogleError = useCallback((msg: string) => setError(msg), []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await registro(email, username, password);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo falló, probá de nuevo');
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-4 py-20">
      <h1 className="font-display text-3xl">Crear cuenta</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-papel/50">
            Email
          </span>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-papel/50">
            Usuario
          </span>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={30}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-papel/50">
            Contraseña
          </span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <span className="mt-1 block font-mono text-[11px] text-papel/40">
            mínimo 8 caracteres
          </span>
        </label>
        {error && <p className="text-sm text-terciopelo">{error}</p>}
        <Boton type="submit" variante="primario" disabled={enviando} className="w-full">
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </Boton>
      </form>
      {googleHabilitado && (
        <>
          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-borde" />
            <span className="font-mono text-xs uppercase tracking-wider text-papel/40">o</span>
            <span className="h-px flex-1 bg-borde" />
          </div>
          <BotonGoogle texto="signup_with" onError={onGoogleError} />
        </>
      )}
      <p className="mt-6 text-xs text-papel/40">
        Al crear una cuenta aceptás nuestra{' '}
        <Link href="/privacidad" className="underline underline-offset-4 hover:text-papel">
          política de privacidad
        </Link>
        .
      </p>
      <p className="mt-4 text-sm text-papel/60">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="text-papel underline-offset-4 hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
