/**
 * Validation Constants for Azuralis Healthcare Platform
 * Centralizes all validation rules and messages for consistent validation across the application
 */

export const VALIDATION_RULES = {
  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    MESSAGES: {
      TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
      NO_LOWERCASE: 'La contraseña debe contener al menos una letra minúscula',
      NO_UPPERCASE: 'La contraseña debe contener al menos una letra mayúscula',
      NO_NUMBER: 'La contraseña debe contener al menos un número',
    },
  },

  // Email Validation
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGES: {
      INVALID: 'Debe ingresar un email válido',
      ALREADY_REGISTERED: 'Este correo ya está registrado',
    },
  },

  // RUT Validation (Chilean ID)
  RUT: {
    PATTERN: /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
    MESSAGES: {
      INVALID_FORMAT: 'El RUT debe tener el formato 12.345.678-9',
      ALREADY_REGISTERED: 'Este RUT ya está registrado en el sistema',
    },
  },

  // Name Validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    MESSAGES: {
      TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
      TOO_LONG: 'El nombre no puede exceder 100 caracteres',
    },
  },
};

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    USER_NOT_FOUND: 'Usuario no encontrado',
    UNAUTHORIZED: 'No autorizado',
    TOKEN_EXPIRED: 'Token expirado',
    INVALID_TOKEN: 'Token inválido',
  },
  USER: {
    ALREADY_EXISTS: 'Este usuario ya existe',
    NOT_FOUND: 'Usuario no encontrado',
    EMAIL_IN_USE: 'Este email ya está en uso',
    RUT_IN_USE: 'Este RUT ya está registrado',
  },
  PATIENT: {
    NOT_FOUND: 'Paciente no encontrado',
    ALREADY_EXISTS: 'Paciente ya registrado',
    INVALID_DATA: 'Datos del paciente inválidos',
  },
  GENERAL: {
    INTERNAL_ERROR: 'Error interno del servidor',
    BAD_REQUEST: 'Solicitud inválida',
    FORBIDDEN: 'Acceso denegado',
    NOT_FOUND: 'Recurso no encontrado',
  },
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
