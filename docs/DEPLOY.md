# Deploy de Raccord

Infraestructura: Supabase (DB, ya en producción desde la Fase 1) + Render
(backend y frontend) + dominio `raccord.com.ar` en NIC.ar con DNS en Cloudflare.

## 1. Render — crear los servicios desde el Blueprint

1. Cuenta en [render.com](https://render.com) (el plan free alcanza; los
   servicios se duermen tras 15 min sin tráfico y tardan ~30s en despertar,
   aceptable para un portfolio).
2. **New → Blueprint** → conectar el repo `tomasrosa-git/Raccord`. Render lee
   `render.yaml` y propone los dos servicios: `raccord-api` y `raccord-web`.
3. Antes de aplicar, cargar los secretos que el blueprint marca `sync: false`
   (todos en `raccord-api`):
   - `DATABASE_URL` — la connection string del **pooler** de Supabase
     (puerto 6543, con `?pgbouncer=true`), la misma del `.env` local.
   - `DIRECT_URL` — la conexión directa (puerto 5432).
   - `JWT_SECRET` — generar uno **nuevo** para producción: `openssl rand -hex 32`.
     No reusar el de desarrollo.
   - `TMDB_API_KEY` — la misma key de TMDB.
4. Aplicar. El primer deploy tarda unos minutos; `raccord-api` corre
   `prisma migrate deploy` al arrancar (no-op si la DB ya está migrada).
5. Verificar con las URLs `.onrender.com` que asigna Render:
   - `https://raccord-api-XXXX.onrender.com/health` → `{"status":"ok"}`
   - `https://raccord-web-XXXX.onrender.com` → la home.

   Ojo: hasta configurar el dominio propio, el frontend en `.onrender.com`
   no va a poder autenticar (la cookie de refresh necesita el dominio raíz
   compartido y CORS apunta a raccord.com.ar). El catálogo sí se ve.

## 2. DNS — NIC.ar + Cloudflare

NIC.ar solo delega nameservers, no hostea registros. El camino estándar es
delegar a Cloudflare (gratis):

1. Cuenta en [cloudflare.com](https://cloudflare.com) → **Add site** →
   `raccord.com.ar` → plan Free. Cloudflare te da dos nameservers
   (ej: `ana.ns.cloudflare.com` y `bob.ns.cloudflare.com`).
2. En [nic.ar](https://nic.ar) → tu dominio → **Delegaciones** → reemplazar
   por esos dos nameservers. La propagación puede tardar de minutos a horas.
3. En Cloudflare → DNS → agregar registros (ambos **DNS only**, nube gris —
   con proxy naranja Render no puede emitir el certificado TLS):

   | Tipo  | Nombre | Contenido                        |
   |-------|--------|----------------------------------|
   | CNAME | `@`    | `raccord-web-XXXX.onrender.com`  |
   | CNAME | `api`  | `raccord-api-XXXX.onrender.com`  |

## 3. Dominios custom en Render

1. `raccord-web` → Settings → Custom Domains → agregar `raccord.com.ar`
   (y `www.raccord.com.ar` si se quiere).
2. `raccord-api` → Custom Domains → agregar `api.raccord.com.ar`.
3. Render verifica el DNS y emite TLS solo. Cuando ambos estén verdes:
   - `https://api.raccord.com.ar/health` → `{"status":"ok"}`
   - `https://raccord.com.ar` → la home.

## 4. Smoke test final

1. Registrarse en `https://raccord.com.ar/registro`.
2. Verificar que la sesión persiste al recargar (la cookie de refresh viaja
   entre `raccord.com.ar` y `api.raccord.com.ar` gracias a
   `COOKIE_DOMAIN=.raccord.com.ar` y `sameSite: lax`).
3. Watchlist + like + reseña en una película.

## Cosas que ya quedaron resueltas en el código

- `trust proxy` en Express (rate limiter y cookies `secure` detrás del proxy
  de Render).
- CORS con múltiples orígenes por coma.
- `prisma generate` dentro del build.
- Migraciones en el arranque (`prisma migrate deploy`, idempotente).
- Health check en `/health` para que Render reinicie el servicio si muere.
- El free tier duerme: el primer request tras inactividad tarda ~30s. Si
  molesta para demos, el plan Starter de Render lo evita.
