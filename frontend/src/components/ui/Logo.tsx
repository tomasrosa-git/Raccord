/**
 * Monograma de Raccord: una R enmarcada por brackets de encuadre, con la
 * marca de cambio de rollo en la esquina superior derecha — la posición real
 * donde el proyeccionista ve la señal de cambio de bobina en la copia.
 * Colores hardcodeados a propósito (calcan tokens.css): actualizar ambos
 * si la paleta cambia.
 */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Raccord"
    >
      <g stroke="#3A3632" strokeWidth="1.5" fill="none">
        <path d="M10,10 h5 M10,10 v5" />
        <path d="M38,10 h-5 M38,10 v5" />
        <path d="M10,38 h5 M10,38 v-5" />
        <path d="M38,38 h-5 M38,38 v-5" />
      </g>
      <text x="24" y="33" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="28" fill="#F2EDE4">
        R
      </text>
      <circle cx="38" cy="10" r="3.2" fill="#C9A227" />
    </svg>
  );
}
