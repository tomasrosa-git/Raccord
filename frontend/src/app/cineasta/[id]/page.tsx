import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getPersona,
  getFilmografia,
  getColaboradores,
  getFirmaVisual,
  getPremios,
  getEtapasCarrera,
} from '@/lib/api/personas';
import { ApiError } from '@/lib/api/client';
import { Chip } from '@/components/ui/Chip';
import { EtiquetaSeccion } from '@/components/ui/EtiquetaSeccion';
import { PosterCard } from '@/components/pelicula/PosterCard';
import { FirmaVisual } from '@/components/cineasta/FirmaVisual';
import { ColaboradoresFrecuentes } from '@/components/cineasta/ColaboradoresFrecuentes';
import { LineaDeTiempo } from '@/components/cineasta/LineaDeTiempo';
import { PremiosGanados } from '@/components/cineasta/PremiosGanados';
import { formatearFecha } from '@/lib/utils/formatters';
import type { PersonaDetalle } from '@/types';

export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

async function buscarPersona(id: string): Promise<PersonaDetalle | null> {
  try {
    return await getPersona(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const persona = await buscarPersona(id);
  if (!persona) return {};
  return { title: persona.nombre, description: persona.biografia?.slice(0, 160) };
}

export default async function PaginaCineasta({ params }: Props) {
  const { id } = await params;
  const persona = await buscarPersona(id);
  if (!persona) notFound();

  const [dirigidas, colaboradores, firmaVisual, premios, etapas] = await Promise.all([
    getFilmografia(id, 'DIRECTOR').catch(() => []),
    getColaboradores(id).catch(() => []),
    getFirmaVisual(id).catch(() => []),
    getPremios(id).catch(() => []),
    getEtapasCarrera(id).catch(() => []),
  ]);

  return (
    <article className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Hero del perfil: acá sí hay personalidad. */}
      <header className="flex flex-col gap-8 sm:flex-row sm:items-end">
        {persona.fotoUrl && (
          <div className="relative h-48 w-36 shrink-0 overflow-hidden bg-carbon sm:h-56 sm:w-40">
            <Image
              src={persona.fotoUrl}
              alt={persona.nombre}
              fill
              priority
              sizes="160px"
              className="object-cover"
            />
          </div>
        )}
        <div>
          <EtiquetaSeccion>Cineasta</EtiquetaSeccion>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">
            {persona.nombre}
          </h1>
          <p className="mt-3 font-mono text-xs text-papel/50 sm:text-sm">
            {[
              persona.fechaNacimiento && formatearFecha(persona.fechaNacimiento),
              persona.lugarNacimiento,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </p>
          {persona.estilos.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {persona.estilos.map((e) => (
                <Chip key={e.id}>{e.nombre}</Chip>
              ))}
            </div>
          )}
        </div>
      </header>

      {persona.biografia && (
        <section className="mt-12 max-w-3xl">
          <p className="whitespace-pre-line leading-relaxed text-papel/80">
            {persona.biografia}
          </p>
        </section>
      )}

      <div className="mt-16 space-y-16">
        <FirmaVisual items={firmaVisual} />

        {dirigidas.length > 0 && (
          <section>
            <EtiquetaSeccion>Filmografía como director</EtiquetaSeccion>
            {/* Contact sheet: tira con divisores finos, como negativos. */}
            <div className="mt-6 flex gap-px overflow-x-auto bg-borde pb-2">
              {dirigidas.map((credito, i) => (
                <div key={`${credito.pelicula.id}-${i}`} className="w-36 shrink-0 bg-negro-sala pr-3 sm:w-44">
                  <PosterCard pelicula={credito.pelicula} />
                </div>
              ))}
            </div>
          </section>
        )}

        <ColaboradoresFrecuentes colaboradores={colaboradores} />
        <LineaDeTiempo etapas={etapas} />
        <PremiosGanados premios={premios} />
      </div>
    </article>
  );
}
