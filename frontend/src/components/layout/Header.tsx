'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';

const linkClase =
  'rounded-sm px-3 py-1.5 text-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel';

/** Navegación sobria: la personalidad visual vive en heros y perfiles, no acá. */
export function Header() {
  const { usuario, cargando, logout } = useAuth();

  return (
    <header className="border-b border-borde">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <Logo size={28} />
          Raccord
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/explorar" className={linkClase}>
            Explorar
          </Link>
          {cargando ? null : usuario ? (
            <>
              <Link href="/mi-cuenta/watchlist" className={linkClase}>
                @{usuario.username}
              </Link>
              <button onClick={() => void logout()} className={`${linkClase} cursor-pointer`}>
                Salir
              </button>
            </>
          ) : (
            <Link href="/login" className={linkClase}>
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
