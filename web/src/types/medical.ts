// --- Interfaces relacionadas al Paciente ---

export type CancerType =
  | 'breast'
  | 'colorectal'
  | 'gastric'
  | 'cervical'
  | 'lung'
  | 'prostate'
  | 'testicular'
  | 'renal'
  | 'hepatic'
  | 'other'

export type UserRole = 
  | 'patient' 
  | 'doctor' 
  | 'nurse' 
  | 'guardian';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Operation {
  date: string;
  procedure: string;
  hospital: string;
}

export type CareTeamRole = 
  | 'oncologo_principal'
  | 'cirujano'
  | 'radiologo'
  | 'enfermera_jefe'
  | 'consultor';

export interface CareTeamMember {
  userId: string;       // El ID del DoctorUser o NurseUser
  name: string;         // El nombre, para fácil visualización
  role: CareTeamRole;   // El rol específico que cumple para este paciente
  assignedAt: Date;     // Cuándo fue asignado al equipo
  status: 'active' | 'inactive'; // Para mantener un historial sin borrar
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string; // Formato: 'YYYY-MM-DD'
  rut: string;
  photo?: string;
  diagnosis: string;
  stage: string;
  cancerType: CancerType;
  selectedColor?: CancerType; // Color personalizado elegido por el paciente
  allergies: string[];
  currentMedications: string[];
  emergencyContacts: EmergencyContact[];
  operations: Operation[];
  treatmentSummary: string; //Resumen de tratamientos del paciente
  careTeam: CareTeamMember[];
  qrCode: string;
}

export interface PatientNote {
  id: string;
  title?: string;
  content: string;
  date?: string; // Retrocompatibilidad
  createdAt?: string | Date; // Campo real de la BD
  patientId: string;
  authorId: string;
  authorName: string;
  authorRole?: string; // Rol del autor para validación de permisos
}

export type DocumentType = 
  | 'examen'           // Exámenes de laboratorio, imagenología, biopsias
  | 'cirugia'          // Documentos relacionados a cirugías
  | 'quimioterapia'    // Protocolos, recetas y seguimiento de quimioterapia
  | 'radioterapia'     // Documentos de radioterapia
  | 'receta'           // Recetas médicas generales
  | 'informe_medico'   // Informes y resúmenes médicos
  | 'consentimiento'   // Consentimientos informados
  | 'otro';            // Otros documentos

export interface PatientDocument {
  id: string;
  title: string;
  type: DocumentType;
  url: string; // URL del archivo en Azure Blob Storage (se genera automáticamente al subir)
  uploadDate: string;
  patientId: string;
  uploaderId: string;
  description?: string; // Descripción opcional del documento
  isComiteOncologico?: boolean; // Indica si el documento pertenece al Comité Oncológico
}

// --- Otras Interfaces y Constantes ---

export interface RegisterFormData {
  name: string;
  rut: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export const cancerColors: Record<CancerType, { color: string; name: string }> = {
  breast: { color: '#e8a0b9', name: 'Mama' },
  colorectal: { color: '#0033a0', name: 'Colorrectal' },
  gastric: { color: '#ccccff', name: 'Gástrico' },
  cervical: { color: '#008080', name: 'Cervicouterino' },
  lung: { color: '#fdeed9', name: 'Pulmón' },
  prostate: { color: '#75aadb', name: 'Próstata' },
  testicular: { color: '#da70d6', name: 'Testicular' },
  renal: { color: '#ff8c00', name: 'Renal' },
  hepatic: { color: '#50c878', name: 'Hepático' },
  other: { color: '#9333EA', name: 'Otro tipo' },
};

export const doctorColor = '#3B82F6';
export const nurseColor = '#00B4D8';

export const documentType: Record<DocumentType, {color: string; name: string}> = {
  examen : {color: 'bg-blue-100 text-blue-800', name: 'Examen'},
  cirugia: {color: 'bg-red-100 text-red-800', name: 'Cirugía'},
  quimioterapia:{color: 'bg-purple-100 text-purple-800', name: 'Quimioterapia'},
  radioterapia:{color: 'bg-orange-100 text-orange-800', name: 'Radioterapia'},
  receta:{color: 'bg-green-100 text-green-800', name: 'Receta'},
  informe_medico:{color: 'bg-indigo-100 text-indigo-800', name: 'Informe Médico'},
  consentimiento:{color: 'bg-yellow-100 text-yellow-800', name: 'Consentimiento'},
  otro:{color: 'bg-gray-100 text-gray-800', name: 'Otro'},
};

/**
 * Obtiene el color de un tipo de documento
 */
export const getDocumentTypeColor = (type: DocumentType): string => {
  return documentType[type]?.color || documentType.otro.color;
};

/**
 * Obtiene la etiqueta de un tipo de documento
 */
export const getDocumentTypeLabel = (type: DocumentType): string => {
  return documentType[type]?.name || documentType.otro.name;
};

// --- INTERFACES DE USUARIO (Simplificadas y limpias) ---

export interface SearchRecord {
  patientId: string;
  patientRut: string;
  patientName?: string; // Nombre del paciente (se carga dinámicamente)
  patientPhoto?: any; // Foto de perfil del paciente (se carga dinámicamente)
  searchedAt: Date;
}

// Base para todos los usuarios.
interface BaseUser {
  id: string;
  name: string;
  rut: string;
  email: string;
  role: UserRole;
}

// Base para personal clínico para no repetir código.
interface ClinicalStaffUser extends BaseUser {
  role: 'doctor' | 'nurse';
  scanHistory?: SearchRecord[]; // Historial UNIFICADO (QR móvil + búsqueda web) - columna en DB
  searchHistory?: SearchRecord[]; // Alias para frontend - convertido por backend desde scanHistory
  assignedPatients?: string[];
}

// Tipos de usuario específicos.
export interface PatientUser extends BaseUser {
  role: 'patient';
  patientId: string;
}

export interface GuardianUser extends BaseUser {
  role: 'guardian';
  patientIds: string[];
}

export interface DoctorUser extends ClinicalStaffUser {
  role: 'doctor';
  specialization?: string;
  license?: string;
}

export interface NurseUser extends ClinicalStaffUser {
  role: 'nurse';
  department?: string;
  license?: string;
}

// Tipo de unión final para cualquier tipo de usuario.
export type User = 
  | PatientUser 
  | GuardianUser 
  | DoctorUser 
  | NurseUser;

// --- MODELO DE PERMISOS UNIFICADO (RBAC) ---

export type CrudActions = {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
};

export type OwnershipScope = 'own' | 'all';

export interface AppPermissions {
  patientProfile?: {
    editableFields: Set<keyof Patient>;
  };
  notes?: CrudActions & { scope: OwnershipScope };
  documents?: CrudActions & { scope: OwnershipScope };
}

// --- PERFILES DE PERMISOS POR ROL ---

export const DOCTOR_PERMISSIONS: AppPermissions = {
  patientProfile: {
    editableFields: new Set<keyof Patient>([
      'diagnosis', 'stage', 'cancerType', 
      'allergies', 'currentMedications', 'emergencyContacts', 
      'operations', 'treatmentSummary','careTeam'
    ]),
  },
  notes: { 
    create: true, 
    read: true, 
    update: true,
    delete: true, 
    scope: 'all' 
  },
  documents: { 
    create: true, 
    read: true, 
    update: true,
    delete: true, 
    scope: 'all' 
  },
};

export const NURSE_PERMISSIONS: AppPermissions = {
  patientProfile: {
    editableFields: new Set<keyof Patient>([
      'currentMedications',  // Solo puede editar medicamentos y resumen de tratamiento
      'treatmentSummary'
    ]),
  },
  notes: { create: true, read: true, update: true, delete: false, scope: 'all' },
  documents: { create: true, read: true, update: true, delete: false, scope: 'all' },
};

export const GUARDIAN_PERMISSIONS: AppPermissions = {
    patientProfile: {
    editableFields: new Set<keyof Patient>([
      'diagnosis', 'stage', 'cancerType', 
      'allergies', 'currentMedications', 'emergencyContacts', 
      'operations', 'treatmentSummary', 'careTeam'
    ]),
  },
  notes: { create: true, read: true, update: true, delete: true, scope: 'own' },
  documents: { create: true, read: true, update: true, delete: true, scope: 'own' },
};

export const PATIENT_PERMISSIONS: AppPermissions = {
    patientProfile: {
    editableFields: new Set<keyof Patient>([
      'photo', 'name', 'diagnosis', 'stage', 'cancerType', 
      'allergies', 'currentMedications', 'emergencyContacts', 
      'operations', 'treatmentSummary', 'careTeam'
    ]),
  },
  notes: { create: true, read: true, update: true, delete: true, scope: 'own' },
  documents: { create: true, read: true, update: true, delete: true, scope: 'own' },
};

// --- LÓGICA DE VERIFICACIÓN DE PERMISOS (EJEMPLO DE BACKEND) ---

const PERMISSIONS_BY_ROLE: Record<UserRole, AppPermissions> = {
  doctor: DOCTOR_PERMISSIONS,
  nurse: NURSE_PERMISSIONS,
  guardian: GUARDIAN_PERMISSIONS,
  patient: PATIENT_PERMISSIONS, // Un paciente no tiene permisos sobre otros, sino sobre sí mismo.
};

/**
 * Verifica si un usuario puede realizar una acción sobre un recurso específico (nota o documento).
 * @param user El usuario que realiza la acción.
 * @param action La acción a realizar ('create', 'read', 'update', 'delete').
 * @param resource El recurso sobre el que se actúa (una nota o un documento).
 * @returns true si el usuario tiene permiso.
 */
export function canUserModifyResource(
  user: User,
  action: 'update' | 'delete',
  resource: PatientNote | PatientDocument
): boolean {
  const permissions = PERMISSIONS_BY_ROLE[user.role];
  
  // Determina si estamos trabajando con notas o documentos
  const resourceType = 'content' in resource ? 'notes' : 'documents';
  const resourcePermissions = permissions[resourceType];
  
  // 1. ¿El rol tiene permiso para esta acción?
  if (!resourcePermissions?.[action]) {
    return false;
  }
  
  // 2. ¿Cuál es el alcance del permiso?
  const scope = resourcePermissions.scope;

  if (scope === 'all') {
    return true; // Si el scope es 'all', siempre tiene permiso.
  }

  if (scope === 'own') {
    // Si el scope es 'own', solo tiene permiso si es el autor del recurso.
    const authorId = 'authorId' in resource ? resource.authorId : resource.uploaderId;
    return user.id === authorId;
  }

  return false;
}