'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/** Buscador del header: navega a /buscar?q=… (client nav, sin recarga). */
export function BuscadorHeader() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const termino = q.trim();
    if (termino) router.push(`/buscar?q=${encodeURIComponent(termino)}`);
  }

  return (
    <form onSubmit={onSubmit} role="search" className="relative w-full max-w-xs">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-papel/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="M14 14l4 4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar películas o cineastas"
        aria-label="Buscar"
        className="w-full rounded-sm border border-borde bg-carbon py-1.5 pl-8 pr-3 text-sm text-papel placeholder:text-papel/40 focus:border-papel/40 focus:outline-none"
      />
    </form>
  );
}
