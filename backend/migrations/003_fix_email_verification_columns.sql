-- 003_fix_email_verification_columns.sql
-- Eliminar columnas duplicadas en snake_case (mantener las camelCase)

-- Primero eliminar el índice que apunta a la columna snake_case
DROP INDEX IF EXISTS idx_email_verification_token;

-- Eliminar las columnas duplicadas en snake_case
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_token;
ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires;

-- Crear índice para las columnas camelCase (que usa TypeORM)
CREATE INDEX IF NOT EXISTS idx_emailVerificationToken ON users("emailVerificationToken");
