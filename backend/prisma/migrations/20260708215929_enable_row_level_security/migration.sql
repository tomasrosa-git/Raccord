-- Supabase expone automáticamente una API REST (PostgREST) para todas las
-- tablas del schema public, autenticada con la anon key (pensada para ser
-- pública). Sin RLS, esa API puede leer/editar/borrar cualquier fila. El
-- backend nunca usa esa API (habla directo a Postgres vía Prisma) y se
-- conecta con el rol owner del proyecto, que bypasea RLS por defecto — así
-- que activar RLS sin políticas no afecta al backend, solo cierra el acceso
-- público no autorizado.

ALTER TABLE "Persona" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pelicula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Genero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PeliculaGenero" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditoPelicula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ColorPaleta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Premio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PremioGanado" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EtapaCarrera" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EstiloTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonaEstiloTag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchlistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Like" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeguidorPersona" ENABLE ROW LEVEL SECURITY;
