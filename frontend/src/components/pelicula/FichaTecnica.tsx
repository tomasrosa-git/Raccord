import Link from 'next/link';
import type { PeliculaDetalle } from '@/types';
import { NOMBRE_ROL, formatearDuracion, formatearFecha } from '@/lib/utils/formatters';

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-borde py-3 sm:flex-row sm:items-baseline">
      <dt className="w-32 shrink-0 font-mono text-xs uppercase tracking-wider text-papel/40">
        {etiqueta}
      </dt>
      <dd className="text-sm text-papel/90">{children}</dd>
    </div>
  );
}

function ListaPersonas({ personas }: { personas: { id: string; nombre: string }[] }) {
  return (
    <>
      {personas.map((p, i) => (
        <span key={`${p.id}-${i}`}>
          {i > 0 && ', '}
          <Link href={`/cineasta/${p.id}`} className="underline-offset-4 hover:underline">
            {p.nombre}
          </Link>
        </span>
      ))}
    </>
  );
}

export function FichaTecnica({ pelicula }: { pelicula: PeliculaDetalle }) {
  const porRol = (rol: string) => pelicula.crew.filter((c) => c.rol === rol);
  const filas = (['GUIONISTA', 'FOTOGRAFIA', 'MONTAJE', 'MUSICA', 'PRODUCTOR'] as const)
    .map((rol) => ({ rol, personas: porRol(rol) }))
    .filter(({ personas }) => personas.length > 0);

  return (
    <dl>
      {pelicula.directores.length > 0 && (
        <Fila etiqueta={NOMBRE_ROL.DIRECTOR}>
          <ListaPersonas personas={pelicula.directores} />
        </Fila>
      )}
      {filas.map(({ rol, personas }) => (
        <Fila key={rol} etiqueta={NOMBRE_ROL[rol]}>
          <ListaPersonas personas={personas} />
        </Fila>
      ))}
      {pelicula.fechaEstreno && (
        <Fila etiqueta="Estreno">{formatearFecha(pelicula.fechaEstreno)}</Fila>
      )}
      {pelicula.duracionMin && (
        <Fila etiqueta="Duración">{formatearDuracion(pelicula.duracionMin)}</Fila>
      )}
      {pelicula.aspectRatio && <Fila etiqueta="Formato">{pelicula.aspectRatio}</Fila>}
      {pelicula.tituloOriginal && pelicula.tituloOriginal !== pelicula.titulo && (
        <Fila etiqueta="Título original">{pelicula.tituloOriginal}</Fila>
      )}
    </dl>
  );
}
