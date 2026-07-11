import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-borde">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="font-mono text-xs text-papel/40">
            Raccord — cine de autor, del lado del director.
          </p>
          <Link
            href="/privacidad"
            className="font-mono text-xs text-papel/40 underline-offset-4 hover:text-papel/70 hover:underline"
          >
            Política de privacidad
          </Link>
        </div>
        {/* Atribución obligatoria por los términos de uso de TMDB. */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
            alt="TMDB"
            className="h-3 w-auto"
          />
          <p className="text-xs text-papel/40">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
