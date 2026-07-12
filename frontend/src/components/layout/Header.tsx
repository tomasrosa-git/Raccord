'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils/cn';
import { BuscadorHeader } from './BuscadorHeader';

const linkClase =
  'rounded-sm px-3 py-1.5 text-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel';

const SECCIONES = [
  { href: '/explorar', label: 'Películas' },
  { href: '/directores', label: 'Directores' },
  { href: '/decadas', label: 'Décadas' },
  { href: '/juegos', label: 'Juegos' },
];

/** Cuenta: "Ingresar", o el usuario + salir si hay sesión. */
function NavCuenta({ className }: { className?: string }) {
  const { usuario, cargando, logout } = useAuth();
  if (cargando) return null;
  return usuario ? (
    <>
      <Link href="/mi-cuenta/watchlist" className={className}>
        @{usuario.username}
      </Link>
      <button onClick={() => void logout()} className={cn(className, 'cursor-pointer text-left')}>
        Salir
      </button>
    </>
  ) : (
    <Link href="/login" className={className}>
      Ingresar
    </Link>
  );
}

/**
 * Navegación: logo, secciones de catálogo, buscador y cuenta. Por debajo de
 * `sm` colapsa a un botón de menú: la barra angosta no alcanza para todo eso
 * en una fila y forzarlo en varias (como antes) empujaba el contenido fuera
 * del primer pantallazo del celular.
 */
export function Header() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();

  // Cerrar el menú al navegar a otra sección: ajustar el estado durante el
  // render (comparando contra el pathname anterior) evita el efecto extra.
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAbierto(false);
  }

  return (
    <header className="border-b border-borde">
      <div className="mx-auto flex max-w-6xl items-center gap-x-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
          <Logo size={28} />
          Raccord
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {SECCIONES.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClase}>
              {label}
            </Link>
          ))}
        </nav>

        {/* El buscador empuja la cuenta a la derecha; en mobile vive en el menú. */}
        <div className="hidden sm:ml-auto sm:block sm:w-auto sm:max-w-xs sm:flex-1">
          <Suspense fallback={null}>
            <BuscadorHeader />
          </Suspense>
        </div>

        <nav className="hidden items-center gap-1 sm:ml-2 sm:flex">
          <NavCuenta className={linkClase} />
        </nav>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-mobile"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel sm:hidden"
        >
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            {abierto ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 5.5h14M3 10h14M3 14.5h14" />}
          </svg>
        </button>
      </div>

      {/* Grid-rows en vez de max-height: anima al alto real del contenido sin medirlo por JS. */}
      <div
        id="menu-mobile"
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out sm:hidden',
          abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden border-t border-borde" inert={!abierto}>
          <div className="px-4 py-4">
            <Suspense fallback={null}>
              <BuscadorHeader />
            </Suspense>
          </div>
          <nav className="flex flex-col px-2 pb-2">
            {SECCIONES.map(({ href, label }) => (
              <Link key={href} href={href} className={cn(linkClase, 'py-2.5')}>
                {label}
              </Link>
            ))}
          </nav>
          <nav className="flex flex-col border-t border-borde px-2 py-2">
            <NavCuenta className={cn(linkClase, 'py-2.5')} />
          </nav>
        </div>
      </div>
    </header>
  );
}
