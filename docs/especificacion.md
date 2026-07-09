# Raccord — Especificación técnica y de diseño

> Documento de diseño del proyecto: modelo de datos, arquitectura, endpoints y sistema de diseño. Funciona como el plan de referencia; la implementación final puede diferir en detalles.

## Contexto del proyecto

**Raccord** es una plataforma web sobre cine de autor, con foco en el director/cineasta como eje central (no solo un catálogo de películas). Es un proyecto de portfolio personal: el objetivo no es la monetización sino construir un sistema real, profesional y escalable. Público: cinéfilos serios, con foco en el mercado hispanohablante/LatAm como diferenciador.

**Principio de diseño:** el producto evita deliberadamente los looks genéricos de plantilla (gradientes violeta-azul, glassmorphism, cards con sombra suave idénticas entre sí, paleta crema+terracota, iconografía de stock sin criterio). El sistema de diseño está especificado en detalle más abajo y se sigue con precisión.

El desarrollo local es liviano: toda la infraestructura pesada (base de datos, jobs de sync, procesamiento de imágenes) corre en servicios en la nube, no en la máquina de desarrollo.

---

## Stack técnico

**Frontend:**
- Next.js 14+ (App Router), TypeScript
- Tailwind CSS
- Recharts (para visualizaciones de datos, ej. gráficos de firma visual)
- Framer Motion (para las micro-interacciones del sistema de diseño, con moderación)

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM (justificación abajo; se descartó TypeORM)
- PostgreSQL (hosteado en Supabase)

**Infraestructura:**
- Base de datos: Supabase (Postgres gestionado)
- Backend: Render (Web Service)
- Frontend: Render (Web Service, Next.js con `next build` + `next start`, SSR/ISR)
- Dominio propio comprado en NIC.ar, con subdominios: `raccord.com.ar` (frontend) y `api.raccord.com.ar` (backend), bajo el mismo dominio raíz para poder compartir cookies con `sameSite: lax`
- Datos externos: TMDB API (gratis, plan Developer, atribución obligatoria en el footer/about)

**Por qué Prisma y no TypeORM:** tipado generado automáticamente desde el schema (nunca se desincroniza), migraciones más confiables, y el archivo `schema.prisma` funciona como documentación legible del modelo de datos completo — importante para un proyecto de portfolio.

---

## Modelo de datos (Prisma schema completo)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum RolCredito {
  DIRECTOR
  ACTOR
  GUIONISTA
  FOTOGRAFIA
  MONTAJE
  MUSICA
  PRODUCTOR
}

enum Rol {
  USUARIO
  ADMIN
}

model Persona {
  id              String   @id @default(uuid())
  tmdbId          Int?     @unique
  nombre          String
  biografia       String?
  fechaNacimiento DateTime?
  lugarNacimiento String?
  fotoUrl         String?
  createdAt       DateTime @default(now())

  creditos        CreditoPelicula[]
  etapasCarrera   EtapaCarrera[]
  premios         PremioGanado[]
  estilos         PersonaEstiloTag[]
  seguidores      SeguidorPersona[]

  @@index([nombre])
}

model Pelicula {
  id              String   @id @default(uuid())
  tmdbId          Int      @unique
  titulo          String
  tituloOriginal  String?
  sinopsis        String?
  fechaEstreno    DateTime?
  duracionMin     Int?
  aspectRatio     String?  // ej: "2.39:1" — usado en el letterbox del hero
  posterUrl       String?
  backdropUrl     String?
  createdAt       DateTime @default(now())

  generos         PeliculaGenero[]
  creditos        CreditoPelicula[]
  paleta          ColorPaleta[]
  premios         PremioGanado[]
  reviews         Review[]
  watchlist       WatchlistItem[]
  likes           Like[]

  @@index([titulo])
}

model Genero {
  id        String @id @default(uuid())
  nombre    String @unique
  peliculas PeliculaGenero[]
}

model PeliculaGenero {
  peliculaId String
  generoId   String
  pelicula   Pelicula @relation(fields: [peliculaId], references: [id])
  genero     Genero   @relation(fields: [generoId], references: [id])

  @@id([peliculaId, generoId])
}

model CreditoPelicula {
  id         String     @id @default(uuid())
  peliculaId String
  personaId  String
  rol        RolCredito
  personaje  String?
  orden      Int?

  pelicula   Pelicula @relation(fields: [peliculaId], references: [id])
  persona    Persona  @relation(fields: [personaId], references: [id])

  @@index([personaId, rol])
  @@index([peliculaId])
}

model ColorPaleta {
  id         String   @id @default(uuid())
  peliculaId String
  colorHex   String
  porcentaje Float
  stillUrl   String?

  pelicula   Pelicula @relation(fields: [peliculaId], references: [id])

  @@index([peliculaId])
}

model Premio {
  id      String @id @default(uuid())
  nombre  String
  categoria String
  ganados PremioGanado[]
}

model PremioGanado {
  id         String   @id @default(uuid())
  premioId   String
  anio       Int
  ganador    Boolean  @default(false)
  peliculaId String?
  personaId  String?

  premio     Premio    @relation(fields: [premioId], references: [id])
  pelicula   Pelicula? @relation(fields: [peliculaId], references: [id])
  persona    Persona?  @relation(fields: [personaId], references: [id])
}

model EtapaCarrera {
  id          String   @id @default(uuid())
  personaId   String
  titulo      String
  descripcion String
  anioInicio  Int
  anioFin     Int?

  persona     Persona @relation(fields: [personaId], references: [id])
}

model EstiloTag {
  id       String @id @default(uuid())
  nombre   String @unique
  personas PersonaEstiloTag[]
}

model PersonaEstiloTag {
  personaId String
  tagId     String
  persona   Persona   @relation(fields: [personaId], references: [id])
  tag       EstiloTag @relation(fields: [tagId], references: [id])

  @@id([personaId, tagId])
}

model Usuario {
  id            String   @id @default(uuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  avatarUrl     String?
  bio           String?
  rol           Rol      @default(USUARIO)
  createdAt     DateTime @default(now())

  reviews       Review[]
  watchlist     WatchlistItem[]
  likes         Like[]
  siguiendo     SeguidorPersona[]
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id         String   @id @default(uuid())
  tokenHash  String   @unique
  usuarioId  String
  expiresAt  DateTime
  revocado   Boolean  @default(false)
  createdAt  DateTime @default(now())

  usuario    Usuario  @relation(fields: [usuarioId], references: [id])

  @@index([usuarioId])
}

model Review {
  id              String   @id @default(uuid())
  usuarioId       String
  peliculaId      String
  texto           String
  puntuacion      Int
  contieneSpoiler Boolean  @default(false)
  createdAt       DateTime @default(now())

  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  pelicula        Pelicula @relation(fields: [peliculaId], references: [id])

  @@unique([usuarioId, peliculaId])
}

model WatchlistItem {
  id         String   @id @default(uuid())
  usuarioId  String
  peliculaId String
  addedAt    DateTime @default(now())

  usuario    Usuario  @relation(fields: [usuarioId], references: [id])
  pelicula   Pelicula @relation(fields: [peliculaId], references: [id])

  @@unique([usuarioId, peliculaId])
}

model Like {
  id         String   @id @default(uuid())
  usuarioId  String
  peliculaId String
  createdAt  DateTime @default(now())

  usuario    Usuario  @relation(fields: [usuarioId], references: [id])
  pelicula   Pelicula @relation(fields: [peliculaId], references: [id])

  @@unique([usuarioId, peliculaId])
}

model SeguidorPersona {
  usuarioId String
  personaId String
  usuario   Usuario @relation(fields: [usuarioId], references: [id])
  persona   Persona @relation(fields: [personaId], references: [id])

  @@id([usuarioId, personaId])
}
```

**Nota de diseño clave:** `Persona` es un modelo unificado (no hay tablas separadas `Director`/`Actor`). El rol se define por fila en `CreditoPelicula`. Esto es lo que permite calcular "colaboradores frecuentes" con una sola query agregada, sin joins complejos entre tablas separadas.

---

## Estructura de carpetas

### Backend (`backend/`)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # validación de env vars con zod
│   │   ├── prisma.ts
│   │   └── constants.ts
│   ├── modules/
│   │   ├── pelicula/            # controller, service, repository, routes, schema
│   │   ├── persona/
│   │   ├── colaboradores/       # lógica de colaboradores frecuentes
│   │   ├── paleta/               # consulta de firma visual
│   │   ├── premio/
│   │   ├── review/
│   │   ├── watchlist/
│   │   ├── usuario/               # incluye auth.service.ts, auth.middleware.ts
│   │   └── juegos/                # implementar al final
│   ├── integrations/
│   │   └── tmdb/
│   │       ├── tmdb.client.ts
│   │       ├── tmdb.types.ts
│   │       ├── tmdb.sync.service.ts
│   │       └── paleta.extractor.ts
│   ├── middlewares/
│   │   ├── errorHandler.ts
│   │   ├── validateRequest.ts
│   │   ├── rateLimiter.ts
│   │   └── auth.middleware.ts
│   ├── shared/
│   │   ├── utils/
│   │   ├── errors/AppError.ts
│   │   └── types/
│   ├── jobs/
│   │   └── syncTmdb.job.ts
│   ├── app.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
├── .env.example
├── tsconfig.json
└── package.json
```

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (marketing)/page.tsx
│   │   ├── pelicula/[id]/page.tsx        # ISR, revalidate: 3600
│   │   ├── cineasta/[id]/
│   │   │   ├── page.tsx                    # ISR
│   │   │   └── @modal/                     # parallel route
│   │   ├── explorar/page.tsx               # SSR con filtros
│   │   ├── juegos/
│   │   │   ├── frame-guess/page.tsx
│   │   │   └── adivina-el-director/page.tsx
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/registro/page.tsx
│   │   ├── mi-cuenta/{watchlist,likes,reviews}/page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/
│   │   ├── pelicula/{PosterCard,FichaTecnica,PeliculasSimilares}.tsx
│   │   ├── cineasta/{FirmaVisual,ColaboradoresFrecuentes,LineaDeTiempo,PremiosGanados}.tsx
│   │   └── layout/{Header,Footer}.tsx
│   ├── lib/
│   │   ├── api/{client,peliculas,personas,usuarios}.ts
│   │   ├── hooks/{useWatchlist,useAuth}.ts
│   │   └── utils/{formatters,cn}.ts
│   ├── types/index.ts
│   └── styles/tokens.css
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Endpoints REST

```
# Películas
GET    /api/peliculas                     # paginado, filtros por género/año
GET    /api/peliculas/:id
GET    /api/peliculas/:id/similares
GET    /api/peliculas/:id/paleta

# Personas
GET    /api/personas/:id
GET    /api/personas/:id/filmografia
GET    /api/personas/:id/colaboradores     # cacheado, 1h TTL
GET    /api/personas/:id/firma-visual      # cacheado, 1h TTL
GET    /api/personas/:id/premios
GET    /api/personas/:id/etapas-carrera

GET    /api/premios/:id/ganadores

# Reviews (auth requerido)
POST   /api/peliculas/:id/reviews
GET    /api/peliculas/:id/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id

# Watchlist / Likes (auth requerido)
POST   /api/watchlist/:peliculaId
DELETE /api/watchlist/:peliculaId
GET    /api/usuarios/me/watchlist
POST   /api/likes/:peliculaId
DELETE /api/likes/:peliculaId
GET    /api/usuarios/me/likes

# Seguir cineastas (auth requerido)
POST   /api/personas/:id/seguir
DELETE /api/personas/:id/seguir

# Auth
POST   /api/auth/registro
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/usuarios/me

# Admin/sync (protegido con requireAdmin)
POST   /api/admin/sync/tmdb/pelicula/:tmdbId
POST   /api/admin/sync/tmdb/persona/:tmdbId
```

---

## Autenticación

- **Hashing:** `bcryptjs` (NO `bcrypt` nativo — evita problemas de compilación de bindings nativos en Render).
- **Access token:** JWT, TTL 15 minutos, devuelto en el body de la respuesta. El frontend lo guarda en memoria (contexto de React), NUNCA en localStorage.
- **Refresh token:** string aleatorio opaco (crypto.randomBytes), TTL 30 días, guardado **hasheado** (SHA-256) en la tabla `RefreshToken`. Se envía al cliente como cookie `httpOnly`, `secure`, `sameSite: lax`, con `domain` en el dominio raíz compartido.
- **Rotación de refresh tokens:** cada refresh invalida el token anterior y emite uno nuevo (detecta reuso sospechoso).
- **Rate limiting:** aplicar `express-rate-limit` en `/api/auth/login` (5 intentos / 15 min por IP).
- **Middleware `requireAuth`:** valida JWT del header `Authorization: Bearer`.
- **Middleware `requireAdmin`:** valida `rol === 'ADMIN'`, usado en endpoints de sync.

---

## Integración con TMDB — seed inicial

**Directores fundacionales para el seed** (mezcla de eras/países, elegidos porque tienen paletas visuales muy identificables):

Wes Anderson, Pedro Almodóvar, Bong Joon-ho, Lucrecia Martel, Alejandro González Iñárritu, Guillermo del Toro, Denis Villeneuve, Sofia Coppola, Yorgos Lanthimos, Céline Sciamma, Park Chan-wook, Damien Chazelle, Greta Gerwig, Alfonso Cuarón, Fernando "Pino" Solanas.

**De estos, curar en profundidad** (con etapas de carrera escritas a mano, tags de estilo, y extracción de paleta desde el día 1): **Wes Anderson, Pedro Almodóvar, Lucrecia Martel, Bong Joon-ho**. El resto arranca con datos automáticos de TMDB únicamente.

**Proceso de sync por director:**
1. `GET /person/{id}` → crear/actualizar `Persona`
2. `GET /person/{id}/movie_credits` → filtrar créditos como Director
3. Por cada película: `GET /movie/{id}`, `GET /movie/{id}/credits`, `GET /movie/{id}/images`
4. Guardar película, créditos completos (cast + crew relevante), y géneros
5. Si es director "curado en profundidad": extraer paleta de los primeros 5 backdrops con `node-vibrant`, guardar en `ColorPaleta`

**Control de concurrencia:** usar `p-limit` (máximo 4 requests concurrentes a TMDB) para no saturar el rate limit ni el proceso propio.

**Premios** (solo para los 4 directores curados, proceso manual/puntual, no automatizado en el cron regular): consultar Wikidata vía SPARQL (gratis, sin API key) para obtener premios estructurados (Oscar, Cannes, Goya, etc.) y cargarlos a mano en `Premio`/`PremioGanado`.

**Atribución obligatoria:** mostrar el logo de TMDB y el texto "This product uses the TMDB API but is not endorsed or certified by TMDB" en el footer/about, por los términos de uso del plan gratuito no comercial.

---

## Caching y performance

- **Fichas de película y perfiles de cineasta:** ISR en Next.js, `revalidate: 3600` (revalidan cada hora, se sirven como estático el resto del tiempo).
- **Home y listados con filtros:** SSR con cache corto (5-10 min).
- **Watchlist/likes/reviews propias:** Client-side rendering puro (data específica del usuario).
- **Queries agregadas pesadas** (`/colaboradores`, `/firma-visual`): cache en memoria con `node-cache`, TTL 1 hora — no usar Redis todavía, sería sobre-ingeniería a esta escala.
- **Imágenes:** siempre `next/image`, nunca `<img>`. Configurar `remotePatterns` para el dominio de TMDB. Usar el tamaño de imagen más chico que se vea bien en cada contexto (no siempre `original`).
- **Evitar N+1 en Prisma:** usar siempre `include`/`select` explícito en queries con relaciones, nunca iterar y hacer una query por item.

---

## Sistema de diseño

**Fundamento:** el mundo visual de Raccord nace de la sala de proyección y la técnica de montaje — negro de sala, marcas de cambio de rollo (cue marks), letterbox, contact sheets de negativos. Se evitan los looks genéricos de plantilla (específicamente: paleta crema + serif alto contraste + acento terracota `#D97757`; fondo negro + acento verde ácido; layout tipo diario con hairlines).

### Paleta (nombrar las variables CSS exactamente así)

```css
--color-negro-sala: #0E0D0C;      /* fondo principal */
--color-carbon: #1A1816;           /* superficies, cards */
--color-papel: #F2EDE4;            /* texto principal */
--color-marca-cambio: #C9A227;     /* acento primario — usar con moderación */
--color-terciopelo: #8B2E2E;       /* acento secundario — ratings, likes, spoilers */
--color-borde: #3A3632;            /* líneas/dividers sutiles */
```

### Tipografía

- **Display** (títulos, nombres de directores): **Piazzolla** (Google Fonts) — serif editorial con carácter.
- **Cuerpo** (reseñas, biografías, texto general): **Work Sans** (Google Fonts).
- **Utilitaria** (specs técnicas: duración, año, aspect ratio, formato): **IBM Plex Mono** (Google Fonts).

### Estructura y layout

- **Hero de película/director:** enmarcado con barras de letterbox reales, calculadas según el `aspectRatio` real de la película (2.39:1, 1.85:1, etc.) — es información funcional, no decoración.
- **Listados/filmografía:** layout tipo "contact sheet" (hoja de contactos de negativos) — miniaturas en tira horizontal con línea fina divisoria simulando el corte entre fotogramas, en vez de un grid de cards genérico.
- **Firma visual del director:** timeline horizontal de swatches de color (uno por película, en orden cronológico), usando los datos de `ColorPaleta`.

### Elemento de firma (signature)

Motivo recurrente de "marca de cambio de rollo": un círculo simple en `--color-marca-cambio` que aparece como:
- Micro-destello breve en transiciones de página
- Indicador de item activo en carruseles
- Bullet antes de labels de sección (reemplaza iconografía genérica)

### Dónde NO aplicar personalidad fuerte

Formularios (login/registro), navegación general, y cards de listados simples se mantienen sobrios y predecibles. La personalidad visual se concentra en: hero, perfil de director, firma visual, y el motivo de marca de cambio. Si todo tiene personalidad, nada la tiene.

### Reglas técnicas de implementación

- Responsive hasta mobile obligatorio.
- Focus visible en todos los elementos interactivos (accesibilidad de teclado).
- Respetar `prefers-reduced-motion` en todas las animaciones de Framer Motion.
- Copy en español rioplatense, tono directo, sin filler ("Guardá en tu watchlist", no "¡Guarda esta increíble película en tu watchlist!").

---

## Juegos (implementar en una fase posterior, una vez el catálogo esté poblado)

1. **Frame Guess:** mostrar un still parcialmente pixelado/cropeado de una película del catálogo, el usuario adivina el título. Dificultad progresiva revelando más de la imagen con cada intento fallido.
2. **Adivina el director (estilo Wordle):** el usuario tira nombres de directores del catálogo, el juego marca coincidencias de atributos (década activa, país, género predominante, colaborador frecuente).
3. **20 preguntas cinéfilas:** revelar pistas una por una (año, género, actor principal, etc.) con intentos limitados, usando datos ya existentes en el catálogo.

---

## Roadmap de desarrollo

Orden de implementación por fases:

1. Setup de monorepo/carpetas, configuración de Prisma + Supabase, correr la migración inicial del schema.
2. Backend: módulo `usuario` completo (auth con JWT + refresh token rotation).
3. Backend: integración TMDB (`tmdb.client.ts`) + script de seed con los 15 directores fundacionales.
4. Backend: módulos `pelicula` y `persona` con sus endpoints CRUD/consulta.
5. Backend: módulo `colaboradores` (query agregada) + extracción de paletas para los 4 directores curados.
6. Frontend: estructura base, sistema de diseño (tokens, tipografía, componentes `ui/`).
7. Frontend: página de película y perfil de cineasta (con firma visual y colaboradores frecuentes).
8. Frontend: auth (login/registro), watchlist, likes, reviews.
9. Deploy: Supabase + Render (backend y frontend) + configuración de dominio en NIC.ar.
10. Juegos (fase final, opcional para el primer release).
