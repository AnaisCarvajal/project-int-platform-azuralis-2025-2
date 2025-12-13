/**
 * Frontend Validation Constants
 * Mirrors backend validation rules for consistent client-side validation
 */

export const FRONTEND_VALIDATION = {
  // Password Requirements
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    HELP_TEXT: 'Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números',
    MESSAGES: {
      TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres',
      NO_LOWERCASE: 'La contraseña debe contener al menos una letra minúscula',
      NO_UPPERCASE: 'La contraseña debe contener al menos una letra mayúscula',
      NO_NUMBER: 'La contraseña debe contener al menos un número',
      MISMATCH: 'Las contraseñas no coinciden',
    },
  },

  // Email Validation
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGES: {
      INVALID: 'Email inválido',
      REQUIRED: 'Email es requerido',
      ALREADY_REGISTERED: 'Este correo ya está registrado',
    },
  },

  // RUT Validation (Chilean ID)
  RUT: {
    PATTERN: /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/,
    PLACEHOLDER: 'XX.XXX.XXX-X',
    MESSAGES: {
      INVALID_FORMAT: 'Formato: XX.XXX.XXX-X',
      REQUIRED: 'RUT es requerido',
      ALREADY_REGISTERED: 'Este RUT ya está registrado',
    },
  },

  // Name Validation
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    MESSAGES: {
      TOO_SHORT: 'El nombre debe tener al menos 2 caracteres',
      TOO_LONG: 'El nombre no puede exceder 100 caracteres',
      REQUIRED: 'Nombre es requerido',
    },
  },
};

export const API_ERROR_RESPONSES = {
  409: {
    title: 'Recurso duplicado',
    description: 'Este usuario ya existe en el sistema',
  },
  400: {
    title: 'Datos inválidos',
    description: 'Por favor verifica que todos los campos estén correctamente completos',
  },
  401: {
    title: 'No autorizado',
    description: 'Credenciales inválidas',
  },
  403: {
    title: 'Acceso denegado',
    description: 'No tienes permisos para acceder a este recurso',
  },
  404: {
    title: 'No encontrado',
    description: 'El recurso solicitado no existe',
  },
  500: {
    title: 'Error del servidor',
    description: 'Algo salió mal. Por favor intenta más tarde',
  },
};

export const TIMEOUT_CONFIG = {
  API_REQUEST: 30000, // 30 seconds
  SESSION_EXPIRY: 3600000, // 1 hour
  TOKEN_REFRESH: 300000, // 5 minutes before expiry
};
