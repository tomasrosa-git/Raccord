'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { cn } from '@/lib/utils/cn';

const TABS = [
  { href: '/mi-cuenta/watchlist', label: 'Watchlist' },
  { href: '/mi-cuenta/likes', label: 'Me gusta' },
  { href: '/mi-cuenta/reviews', label: 'Reseñas' },
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
      <h1 className="mt-4 font-display text-3xl">@{usuario.username}</h1>

      <nav className="mt-8 flex gap-1 border-b border-borde">
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
