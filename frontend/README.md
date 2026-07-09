# Raccord — Frontend

Cliente web de Raccord: Next.js (App Router) + TypeScript + Tailwind CSS.

Renderiza el catálogo (fichas de película y perfiles de cineasta con firma
visual), la búsqueda, y la sección de cuenta (watchlist, likes, reseñas).
Las fichas y perfiles usan ISR (`revalidate: 3600`); la data específica del
usuario se resuelve del lado del cliente.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
```

Requiere el backend corriendo (por defecto `http://localhost:4000`). Para
apuntar a otra API, definir `NEXT_PUBLIC_API_URL`.

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servir el build
- `npm run lint` — linter

El sistema de diseño (paleta, tipografía, motivos visuales) está documentado en
[`../docs/especificacion.md`](../docs/especificacion.md).
