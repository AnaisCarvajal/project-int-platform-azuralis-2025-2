-- 002_email_verification.sql
-- Migration para agregar campos de verificación de email

ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationToken" VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMP;

-- Crear índice para búsquedas rápidas de tokens de verificación
CREATE INDEX IF NOT EXISTS idx_emailVerificationToken ON users("emailVerificationToken");
