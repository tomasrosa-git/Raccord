import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL es requerida'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DIAS: z.coerce.number().int().positive().default(30),
  COOKIE_DOMAIN: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Requerida a partir de la integración con TMDB (Fase 3)
  TMDB_API_KEY: z.string().optional(),

  // OAuth Client ID de Google. Se usa como `audience` al verificar el ID token.
  // Opcional: sin él, el endpoint /api/auth/google queda deshabilitado.
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
