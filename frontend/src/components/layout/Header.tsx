'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { BuscadorHeader } from './BuscadorHeader';

const linkClase =
  'rounded-sm px-3 py-1.5 text-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel';

/** Navegación: logo, secciones de catálogo, buscador y cuenta. */
export function Header() {
  const { usuario, cargando, logout } = useAuth();

  return (
    <header className="border-b border-borde">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <Logo size={28} />
          Raccord
        </Link>

        <nav className="flex items-center gap-1">
          <Link href="/explorar" className={linkClase}>
            Películas
          </Link>
          <Link href="/directores" className={linkClase}>
            Directores
          </Link>
          <Link href="/decadas" className={linkClase}>
            Décadas
          </Link>
        </nav>

        {/* El buscador empuja la cuenta a la derecha. Suspense: usa useSearchParams. */}
        <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto sm:flex-1 sm:max-w-xs">
          <Suspense fallback={null}>
            <BuscadorHeader />
          </Suspense>
        </div>

        <nav className="flex items-center gap-1 sm:ml-2">
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
