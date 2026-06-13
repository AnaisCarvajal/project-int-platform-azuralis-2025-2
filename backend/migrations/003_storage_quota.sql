-- 003_storage_quota.sql
-- Migration para crear tabla de cuota de almacenamiento y función para incrementar storage

-- Tabla user_storage_quota
CREATE TABLE IF NOT EXISTS user_storage_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  used_storage BIGINT DEFAULT 0,
  max_storage BIGINT DEFAULT 536870912, -- 500MB en bytes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_storage_quota_user_id ON user_storage_quota(user_id);

-- Función para incrementar storage
CREATE OR REPLACE FUNCTION increment_storage(
  p_user_id UUID,
  p_file_size BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage BIGINT;
  v_new_usage BIGINT;
  v_max_storage BIGINT;
BEGIN
  -- Obtener la cuota actual del usuario
  SELECT COALESCE(used_storage, 0), max_storage
  INTO v_current_usage, v_max_storage
  FROM user_storage_quota
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Si no existe el registro, crear uno
  IF NOT FOUND THEN
    INSERT INTO user_storage_quota (user_id, used_storage, max_storage)
    VALUES (p_user_id, 0, 536870912) -- 500MB
    ON CONFLICT (user_id) DO NOTHING;
    
    v_current_usage := 0;
    v_max_storage := 536870912;
  END IF;

  -- Calcular el nuevo uso
  v_new_usage := v_current_usage + p_file_size;

  -- Validar que no exceda el límite
  IF v_new_usage > v_max_storage THEN
    RETURN FALSE;
  END IF;

  -- Actualizar el uso
  UPDATE user_storage_quota
  SET used_storage = v_new_usage, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar storage (cuando se elimina un archivo)
CREATE OR REPLACE FUNCTION decrement_storage(
  p_user_id UUID,
  p_file_size BIGINT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage BIGINT;
  v_new_usage BIGINT;
BEGIN
  -- Obtener la cuota actual del usuario
  SELECT used_storage
  INTO v_current_usage
  FROM user_storage_quota
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Calcular el nuevo uso (no puede ser negativo)
  v_new_usage := GREATEST(0, v_current_usage - p_file_size);

  -- Actualizar el uso
  UPDATE user_storage_quota
  SET used_storage = v_new_usage, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear registro de cuota cuando se crea un usuario
CREATE OR REPLACE FUNCTION create_user_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_storage_quota (user_id, used_storage, max_storage)
  VALUES (NEW.id, 0, 536870912) -- 500MB
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_user_storage_quota ON users;
CREATE TRIGGER trigger_create_user_storage_quota
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_storage_quota();
