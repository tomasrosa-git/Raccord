-- Login con Google: las cuentas creadas vía Google no tienen contraseña propia,
-- así que passwordHash pasa a ser opcional. googleId guarda el claim `sub` del
-- ID token de Google (estable por usuario) y es único cuando está presente;
-- permite reconocer al mismo usuario en logins sucesivos y vincularlo por email
-- con una cuenta de email/contraseña ya existente.
ALTER TABLE "Usuario" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Usuario" ADD COLUMN "googleId" TEXT;
CREATE UNIQUE INDEX "Usuario_googleId_key" ON "Usuario"("googleId");
