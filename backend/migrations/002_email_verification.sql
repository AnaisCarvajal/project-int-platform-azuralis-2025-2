-- 002_email_verification.sql
-- Migration para agregar campos de verificación de email

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255) NULLABLE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP NULLABLE;

-- Crear índice para búsquedas rápidas de tokens de verificación
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token);
