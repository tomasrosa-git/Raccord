import Link from 'next/link';
import type { Metadata } from 'next';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';

export const metadata: Metadata = { title: 'Juegos' };

const JUEGOS = [
  {
    href: '/juegos/frame-guess',
    nombre: 'Frame Guess',
    descripcion:
      'Un fotograma desenfocado, cinco intentos. Cada fallo revela un poco más de la imagen.',
    cadencia: 'Uno nuevo por día',
    disponible: true,
  },
  {
    href: '#',
    nombre: 'Duelo de popularidad',
    descripcion: 'Dos películas del catálogo: adiviná cuál es más popular hoy. Hasta que falles.',
    cadencia: 'Partidas ilimitadas',
    disponible: false,
  },
];

export default function PaginaJuegos() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <EtiquetaSeccion>Juegos</EtiquetaSeccion>
      <h1 className="mt-4 font-display text-3xl sm:text-4xl">Poné a prueba tu ojo</h1>
      <p className="mt-3 max-w-xl text-sm text-papel/50">
        Juegos armados con el catálogo de Raccord: los mismos fotogramas, paletas y
        filmografías que ves en las fichas.
      </p>

      <div className="mt-12 grid gap-px bg-borde sm:grid-cols-2">
        {JUEGOS.map((juego) =>
          juego.disponible ? (
            <Link
              key={juego.nombre}
              href={juego.href}
              className="group bg-negro-sala p-6 transition-colors hover:bg-carbon sm:p-8"
            >
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-marca-cambio">
                {juego.cadencia}
              </p>
              <h2 className="mt-3 font-display text-2xl group-hover:text-papel">{juego.nombre}</h2>
              <p className="mt-2 text-sm leading-relaxed text-papel/60">{juego.descripcion}</p>
              <p className="mt-6 font-mono text-xs text-marca-cambio underline-offset-4 group-hover:underline">
                Jugar →
              </p>
            </Link>
          ) : (
            <div key={juego.nombre} className="bg-negro-sala p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-papel/30">
                {juego.cadencia}
              </p>
              <h2 className="mt-3 font-display text-2xl text-papel/40">{juego.nombre}</h2>
              <p className="mt-2 text-sm leading-relaxed text-papel/30">{juego.descripcion}</p>
              <p className="mt-6 font-mono text-xs text-papel/30">Próximamente</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
