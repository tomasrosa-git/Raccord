import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Imagen de preview (Open Graph) que ven iMessage, WhatsApp, Slack, redes, etc.
// al compartir raccord.com.ar. Sin esto, esas apps muestran un genérico.
// Recrea el monograma de marca (brackets de encuadre + R + marca de cambio
// dorada) sobre negro de sala, con la tipografía real: Piazzolla (la serif de
// la marca, misma que el wordmark del header) e IBM Plex Mono en las etiquetas.
// Colores calcados de styles/tokens.css.

export const alt = 'Raccord — cine de autor';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const NEGRO = '#0e0d0c';
const PAPEL = '#f2ede4';
const GOLD = '#c9a227';
const BORDE = '#3a3632';

// Instancias estáticas embebidas (Satori no lee WOFF2 ni fuentes variables).
const fontDir = join(process.cwd(), 'src/fonts');
const piazzollaRegular = readFileSync(join(fontDir, 'Piazzolla-Regular.ttf'));
const piazzollaSemiBold = readFileSync(join(fontDir, 'Piazzolla-SemiBold.ttf'));
const plexMono = readFileSync(join(fontDir, 'IBMPlexMono-Regular.ttf'));

function Bracket({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', width: 40, height: 40, ...style }} />;
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: NEGRO,
          color: PAPEL,
          padding: '72px 80px',
          fontFamily: 'Piazzolla',
        }}
      >
        {/* Etiqueta superior */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 14, height: 14, borderRadius: 14, background: GOLD }} />
          <div
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 24,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: 'rgba(242,237,228,0.6)',
            }}
          >
            Cine de autor
          </div>
        </div>

        {/* Bloque central: monograma + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 44 }}>
          {/* Monograma */}
          <div style={{ position: 'relative', width: 180, height: 180, display: 'flex' }}>
            <Bracket style={{ top: 0, left: 0, borderTop: `4px solid ${BORDE}`, borderLeft: `4px solid ${BORDE}` }} />
            <Bracket style={{ top: 0, right: 0, borderTop: `4px solid ${BORDE}`, borderRight: `4px solid ${BORDE}` }} />
            <Bracket style={{ bottom: 0, left: 0, borderBottom: `4px solid ${BORDE}`, borderLeft: `4px solid ${BORDE}` }} />
            <Bracket style={{ bottom: 0, right: 0, borderBottom: `4px solid ${BORDE}`, borderRight: `4px solid ${BORDE}` }} />
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 128,
                fontWeight: 600,
                lineHeight: 1,
                color: PAPEL,
              }}
            >
              R
            </div>
            <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderRadius: 22, background: GOLD }} />
          </div>

          {/* Wordmark + bajada */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 104, fontWeight: 600, lineHeight: 1 }}>Raccord</div>
            <div style={{ fontSize: 38, fontWeight: 400, color: 'rgba(242,237,228,0.7)', marginTop: 18 }}>
              El cine, del lado de quien lo dirige.
            </div>
          </div>
        </div>

        {/* Pie */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: 'IBM Plex Mono',
            fontSize: 24,
            color: 'rgba(242,237,228,0.4)',
          }}
        >
          <div>raccord.com.ar</div>
          <div>649 películas · 71 directores</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Piazzolla', data: piazzollaRegular, weight: 400, style: 'normal' },
        { name: 'Piazzolla', data: piazzollaSemiBold, weight: 600, style: 'normal' },
        { name: 'IBM Plex Mono', data: plexMono, weight: 400, style: 'normal' },
      ],
    }
  );
}
