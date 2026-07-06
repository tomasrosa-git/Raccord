import Link from 'next/link';

/** Navegación sobria: la personalidad visual vive en heros y perfiles, no acá. */
export function Header() {
  return (
    <header className="border-b border-borde">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl tracking-tight">
          Raccord
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/explorar"
            className="rounded-sm px-3 py-1.5 text-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel"
          >
            Explorar
          </Link>
          <Link
            href="/login"
            className="rounded-sm px-3 py-1.5 text-sm text-papel/70 transition-colors hover:bg-carbon hover:text-papel"
          >
            Ingresar
          </Link>
        </nav>
      </div>
    </header>
  );
}
