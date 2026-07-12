'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/mi-cuenta/panteon', label: 'Panteón' },
  { href: '/mi-cuenta/watchlist', label: 'Watchlist' },
  { href: '/mi-cuenta/likes', label: 'Me gusta' },
  { href: '/mi-cuenta/reviews', label: 'Reseñas' },
  { href: '/mi-cuenta/reviews-directores', label: 'Reseñas de directores' },
];

export default function MiCuentaLayout({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login');
  }, [cargando, usuario, router]);

  if (cargando || !usuario) return <div className="flex-1" />;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Mi cuenta</EtiquetaSeccion>
      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-3xl">@{usuario.username}</h1>
        <Link
          href={`/u/${usuario.username}`}
          className="font-mono text-xs text-marca-cambio underline-offset-4 hover:underline"
        >
          Ver mi perfil público →
        </Link>
      </div>

      <nav className="mt-8 flex flex-wrap gap-1 border-b border-borde">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'border-b-2 px-4 py-2 text-sm transition-colors',
              pathname === tab.href
                ? 'border-marca-cambio text-papel'
                : 'border-transparent text-papel/50 hover:text-papel'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">{children}</div>
    </div>
  );
}
