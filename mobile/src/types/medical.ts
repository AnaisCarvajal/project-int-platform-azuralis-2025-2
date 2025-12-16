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
  | 'other';

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
  userId: string;
  name: string;
  role: CareTeamRole;
  assignedAt: string | Date;
  status: 'active' | 'inactive';
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  rut: string;
  photo?: string;
  diagnosis: string;
  stage: string;
  cancerType: CancerType;
  selectedColor?: CancerType;
  allergies: string[];
  currentMedications: string[];
  emergencyContacts: EmergencyContact[];
  operations: Operation[];
  treatmentSummary: string;
  careTeam: CareTeamMember[];
  qrCode: string;
}

export interface PatientNote {
  id: string;
  title?: string;
  content: string;
  date?: string;
  createdAt?: string | Date;
  patientId: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
}

export type DocumentType =
  | 'examen'
  | 'cirugia'
  | 'quimioterapia'
  | 'radioterapia'
  | 'receta'
  | 'informe_medico'
  | 'consentimiento'
  | 'otro';

export interface PatientDocument {
  id: string;
  title: string;
  type: DocumentType;
  url: string;
  uploadDate: string;
  patientId: string;
  uploaderId: string;
  description?: string;
  isComiteOncologico?: boolean;
}

// PROBANDO
export interface ProfessionalSearchResult {
  id: string;
  name: string;
  rut: string;
  role: string;
  email:string,
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

// 🎨 reemplazo directo de clases Tailwind por colores hex equivalentes
export const documentType: Record<DocumentType, { color: string; name: string }> = {
  examen: { color: '#BFDBFE', name: 'Examen' }, // bg-blue-100 text-blue-800
  cirugia: { color: '#FECACA', name: 'Cirugía' }, // bg-red-100 text-red-800
  quimioterapia: { color: '#E9D5FF', name: 'Quimioterapia' }, // bg-purple-100 text-purple-800
  radioterapia: { color: '#FED7AA', name: 'Radioterapia' }, // bg-orange-100 text-orange-800
  receta: { color: '#BBF7D0', name: 'Receta' }, // bg-green-100 text-green-800
  informe_medico: { color: '#C7D2FE', name: 'Informe Médico' }, // bg-indigo-100 text-indigo-800
  consentimiento: { color: '#FEF08A', name: 'Consentimiento' }, // bg-yellow-100 text-yellow-800
  otro: { color: '#E5E7EB', name: 'Otro' }, // bg-gray-100 text-gray-800
};

export const getDocumentTypeColor = (type: DocumentType): string => {
  return documentType[type]?.color || documentType.otro.color;
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  return documentType[type]?.name || documentType.otro.name;
};

// --- INTERFACES DE USUARIO (Simplificadas y limpias) ---

export interface SearchRecord {
  patientId: string;
  patientRut: string;
  patientName?: string;
  patientPhoto?: any;
  searchedAt: Date;
}

interface BaseUser {
  id: string;
  name: string;
  rut: string;
  email: string;
  role: UserRole;
}

interface ClinicalStaffUser extends BaseUser {
  role: 'doctor' | 'nurse';
  scanHistory?: SearchRecord[];
  searchHistory?: SearchRecord[];
  assignedPatients?: string[];
}

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
      'diagnosis',
      'stage',
      'cancerType',
      'allergies',
      'currentMedications',
      'emergencyContacts',
      'operations',
      'treatmentSummary',
      'careTeam',
    ]),
  },
  notes: { create: true, read: true, update: true, delete: true, scope: 'all' },
  documents: { create: true, read: true, update: true, delete: true, scope: 'all' },
};

export const NURSE_PERMISSIONS: AppPermissions = {
  patientProfile: {
    editableFields: new Set<keyof Patient>(['currentMedications', 'treatmentSummary']),
  },
  notes: { create: true, read: true, update: true, delete: false, scope: 'all' },
  documents: { create: true, read: true, update: true, delete: false, scope: 'all' },
};

export const GUARDIAN_PERMISSIONS: AppPermissions = {
  patientProfile: {
    editableFields: new Set<keyof Patient>([
      'diagnosis',
      'stage',
      'cancerType',
      'allergies',
      'currentMedications',
      'emergencyContacts',
      'operations',
      'treatmentSummary',
      'careTeam',
    ]),
  },
  notes: { create: true, read: true, update: true, delete: true, scope: 'own' },
  documents: { create: true, read: true, update: true, delete: true, scope: 'own' },
};

export const PATIENT_PERMISSIONS: AppPermissions = {
  patientProfile: {
    editableFields: new Set<keyof Patient>([
      'photo',
      'name',
      'diagnosis',
      'stage',
      'cancerType',
      'allergies',
      'currentMedications',
      'emergencyContacts',
      'operations',
      'treatmentSummary',
      'careTeam',
    ]),
  },
  notes: { create: true, read: true, update: true, delete: true, scope: 'own' },
  documents: { create: true, read: true, update: true, delete: true, scope: 'own' },
};

// --- LÓGICA DE VERIFICACIÓN DE PERMISOS ---

const PERMISSIONS_BY_ROLE: Record<UserRole, AppPermissions> = {
  doctor: DOCTOR_PERMISSIONS,
  nurse: NURSE_PERMISSIONS,
  guardian: GUARDIAN_PERMISSIONS,
  patient: PATIENT_PERMISSIONS,
};

export function canUserModifyResource(
  user: User,
  action: 'update' | 'delete',
  resource: PatientNote | PatientDocument
): boolean {
  const permissions = PERMISSIONS_BY_ROLE[user.role];
  const resourceType = 'content' in resource ? 'notes' : 'documents';
  const resourcePermissions = permissions[resourceType];

  if (!resourcePermissions?.[action]) {
    return false;
  }

  const scope = resourcePermissions.scope;

  if (scope === 'all') return true;

  if (scope === 'own') {
    const authorId = 'authorId' in resource ? resource.authorId : resource.uploaderId;
    return user.id === authorId;
  }

  return false;
}
