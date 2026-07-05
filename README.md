# Raccord

Plataforma web sobre cine de autor, con el director/cineasta como eje central.

## Estructura

- `backend/` — API REST: Node.js + Express + TypeScript + Prisma (PostgreSQL en Supabase)
- `frontend/` — Next.js (App Router) + TypeScript + Tailwind CSS
- `docs/` — especificación del proyecto

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

## Infraestructura

- **Base de datos:** Supabase (Postgres gestionado)
- **Backend y frontend:** Render (Web Services)
- **Dominio:** raccord.com.ar (frontend) / api.raccord.com.ar (backend)
- **Datos externos:** TMDB API

This product uses the TMDB API but is not endorsed or certified by TMDB.
