import Link from 'next/link';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { Chip } from '@/components/ui/Chip';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Barra de letterbox superior: guiño al encuadre de proyección. */}
      <div aria-hidden className="h-10 bg-black sm:h-14" />

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
        <EtiquetaSeccion>Cine de autor</EtiquetaSeccion>

        <h1 className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
          El cine, del lado de quien lo dirige.
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-papel/70 sm:text-lg">
          Filmografías completas, colaboradores de siempre y la paleta de color
          que hace reconocible a cada cineasta. Sin algoritmo de moda: catálogo
          curado, empezando por quince directores fundacionales.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/explorar"
            className="rounded-sm bg-marca-cambio px-5 py-2.5 text-sm font-medium text-negro-sala transition-[filter] hover:brightness-110"
          >
            Explorar el catálogo
          </Link>
          <span className="font-mono text-xs text-papel/40">
            261 películas · 15 directores
          </span>
        </div>

        <div className="mt-16 flex flex-wrap gap-2">
          <Chip>Wes Anderson</Chip>
          <Chip>Pedro Almodóvar</Chip>
          <Chip>Lucrecia Martel</Chip>
          <Chip>Bong Joon-ho</Chip>
          <Chip className="text-papel/40">+11 más</Chip>
        </div>
      </section>

      {/* Barra de letterbox inferior. */}
      <div aria-hidden className="h-10 bg-black sm:h-14" />
    </div>
  );
}
