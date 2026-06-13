-- 001_unique_rut.sql
-- Migration para asegurar constraint unique en RUT

-- Crear constraint unique si no existe
ALTER TABLE users ADD CONSTRAINT unique_rut UNIQUE (rut);
