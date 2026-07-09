# Raccord

Plataforma web sobre **cine de autor**, con el director/cineasta como eje
central — no solo un catálogo de películas. En vivo: **[raccord.com.ar](https://raccord.com.ar)**.

En vez de organizar todo alrededor del título, Raccord pone al director en el
centro: filmografía completa, colaboradores frecuentes, premios reales y la
"firma visual" de cada cineasta (la paleta de color de su obra, extraída de los
fotogramas). Foco en el mercado hispanohablante/LatAm como diferenciador.

## Características

- **Perfiles de cineasta** con filmografía como director y como actor,
  colaboradores frecuentes (query agregada sobre créditos) y línea de tiempo.
- **Firma visual:** paleta de color por película extraída de los backdrops con
  `node-vibrant`, mostrada como timeline cronológico.
- **Fichas de película** con hero en letterbox real (calculado según el aspect
  ratio), ficha técnica, elenco, paleta y similares por afinidad.
- **Premios reales** (Óscar, Cannes, Goya, etc.) de los directores curados,
  cargados desde Wikidata vía SPARQL.
- **Búsqueda** de películas, directores y actores, insensible a acentos.
- **Cuenta de usuario:** watchlist, likes y reseñas, con auth propia
  (JWT + refresh token rotation).
- Catálogo poblado desde la **API de TMDB**.

## Estructura

- `backend/` — API REST: Node.js + Express + TypeScript + Prisma (PostgreSQL en Supabase)
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS
- `docs/` — [especificación técnica y de diseño](docs/especificacion.md)

## Desarrollo local

### Backend

```bash
cd backend
cp .env.example .env   # completar DATABASE_URL y DIRECT_URL de Supabase
npm install
npx prisma migrate dev # correr migraciones
npm run dev            # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000
```

## Decisiones técnicas

- **Prisma sobre TypeORM:** tipado generado desde el schema (nunca se
  desincroniza) y `schema.prisma` como documentación legible del modelo.
- **`Persona` como modelo unificado** (no tablas separadas Director/Actor): el
  rol vive en cada fila de `CreditoPelicula`, lo que permite calcular
  colaboradores frecuentes con una sola query agregada.
- **Auth con token en memoria + refresh httpOnly:** el access token (JWT, 15
  min) va en el body y se guarda en memoria (nunca en `localStorage`); el
  refresh (30 días) va en cookie `httpOnly`/`secure` y se guarda hasheado.
- **ISR** en fichas y perfiles (`revalidate: 3600`); cache en memoria para las
  queries agregadas pesadas.

## Infraestructura

- **Base de datos:** Supabase (Postgres gestionado)
- **Backend y frontend:** Render (Web Services)
- **Dominio:** raccord.com.ar (frontend) / api.raccord.com.ar (backend)
- **Datos externos:** TMDB API

This product uses the TMDB API but is not endorsed or certified by TMDB.
