import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../common/config/api.config";
import type {
  Patient,
  PatientNote,
  PatientDocument,
  CareTeamMember,
  UserRole,
  User,
  ProfessionalSearchResult
} from "../types/medical";

// ------------------ axios base ------------------
export const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// 🔐 Interceptor token
api.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error("Error obteniendo token:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------ Tipos ------------------
export interface LoginResponse {
  access_token: string;
  role: UserRole;
}

export interface RegisterResponse {
  message: string;
  email: string;
  role: UserRole;
  id: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  rut: string;
  role: UserRole;
}

// ------------------ API SERVICE ------------------
export const apiService = {
  // ============ AUTH ============
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data as LoginResponse;
  },

  register: async (userData: RegisterData): Promise<RegisterResponse> => {
    const response = await api.post("/auth/register", userData);
    return response.data as RegisterResponse;
  },

  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get(`/auth/profile/${userId}`);
    return response.data as User;
  },

  checkAuthStatus: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data as User;
  },

  // ============ USERS ============
  users: {
    update: async (userId: string, userData: Partial<User>): Promise<User> => {
      // DEBUG: Imprime la URL completa
      console.log(`Petición PATCH a: ${api.defaults.baseURL}/users/${userId}`);
      const response = await api.patch(`/users/${userId}`, userData);
      return response.data as User;
    },

    addSearchHistory: async (
      userId: string,
      patientId: string,
      patientRut: string
    ) => {
      const response = await api.post(`/users/${userId}/search-history`, {
        patientId,
        patientRut,
      });
      return response.data;
    },

    getProfilePicture: async (userId: string) => {
      const response = await api.get(`/users/${userId}/profile-picture`);
      return response.data;
    },

    uploadProfilePicture: async (userId: string, file: any) => {
      const formData = new FormData();

      // RN necesita { uri, name, type }
      if (typeof file === "string") {
        formData.append("file", {
          uri: file,
          name: "profile-picture.webp",
          type: "image/jpeg",
        } as any);
      } else {
        formData.append("file", file);
      }

      const response = await api.post(
        `/users/${userId}/profile-picture`,
        formData
      );
      return response.data as { url?: string };
    },

    // PROBANDO
    search: async (query: string): Promise<ProfessionalSearchResult[]> => {
      const response = await api.get("/users/search", {
        params: { query },
      });
      return response.data as ProfessionalSearchResult[];
    },

  },

  // ============ PATIENTS ============
  patients: {
    create: async (patientData: Partial<Patient>): Promise<Patient> => {
      const response = await api.post("/patients", patientData);
      return response.data as Patient;
    },

    getAll: async (): Promise<Patient[]> => {
      const response = await api.get("/patients");
      return response.data as Patient[];
    },

    getMyCareTeam: async (): Promise<Patient[]> => {
      const response = await api.get("/patients/my-care-team/patients");
      return response.data as Patient[];
    },

    findByRut: async (rut: string): Promise<Patient> => {
      const response = await api.get(`/patients/search/by-rut/${rut}`);
      return response.data as Patient;
    },

    getOne: async (id: string): Promise<Patient> => {
      const response = await api.get(`/patients/${id}`);
      return response.data as Patient;
    },

    update: async (
      id: string,
      patientData: Partial<Patient>
    ): Promise<Patient> => {
      const response = await api.put(`/patients/${id}`, patientData);
      return response.data as Patient;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/patients/${id}`);
    },

    getNotes: async (patientId: string): Promise<PatientNote[]> => {
      const response = await api.get(`/patients/${patientId}/notes`);
      return response.data as PatientNote[];
    },

    getDocuments: async (patientId: string): Promise<PatientDocument[]> => {
      const response = await api.get(`/patients/${patientId}/documents`);
      return response.data as PatientDocument[];
    },

    getQRCode: (id: string): string => {
      return `${API_CONFIG.BASE_URL}/patients/${id}/qr`;
    },

    getName: async (id: string): Promise<string> => {
      const response = await api.get(`/patients/${id}/name`);
      return (response.data as any).name;
    },
    getById: (id: string) => {
    return api.get(`/patients/${id}`);
  },
  },

  // ============ NOTES ============
  notes: {
    create: async (noteData: Partial<PatientNote>): Promise<PatientNote> => {
      const response = await api.post("/patient-notes", noteData);
      return response.data as PatientNote;
    },

    getAll: async (): Promise<PatientNote[]> => {
      const response = await api.get("/patient-notes");
      return response.data as PatientNote[];
    },

    getOne: async (id: string): Promise<PatientNote> => {
      const response = await api.get(`/patient-notes/${id}`);
      return response.data as PatientNote;
    },

    update: async (
      id: string,
      noteData: Partial<PatientNote>
    ): Promise<PatientNote> => {
      const response = await api.put(`/patient-notes/${id}`, noteData);
      return response.data as PatientNote;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/patient-notes/${id}`);
    },
  },

  // ============ DOCUMENTS ============
  documents: {
    create: async (
      docData: Partial<PatientDocument>,
      file?: any
    ): Promise<PatientDocument> => {
      const formData = new FormData();

      if (file) {
        if (typeof file === "string") {
          formData.append("file", {
            uri: file,
            name: "document.webp",
            type: "image/webp",
          } as any);
        } else {
          formData.append("file", file);
        }
      }

      Object.entries(docData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      const response = await api.post("/patient-documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data as PatientDocument;
    },

    getAll: async (): Promise<PatientDocument[]> => {
      const response = await api.get("/patient-documents");
      return response.data as PatientDocument[];
    },

    getOne: async (id: string): Promise<PatientDocument> => {
      const response = await api.get(`/patient-documents/${id}`);
      return response.data as PatientDocument;
    },

    delete: async (id: string): Promise<void> => {
      await api.delete(`/patient-documents/${id}`);
    },

    getDownloadUrl: async (id: string): Promise<any> => {
      const response = await api.get(`/patient-documents/${id}/download-url`);
      return response.data;
    },
  },

  // ============ CARE TEAM ============
  careTeam: {
    addMember: async (
      memberData: Partial<CareTeamMember>
    ): Promise<CareTeamMember> => {
      const response = await api.post("/care-team", memberData);
      return response.data as CareTeamMember;
    },

    getAll: async (): Promise<CareTeamMember[]> => {
      const response = await api.get("/care-team");
      return response.data as CareTeamMember[];
    },

    /*getByPatient: async (patientId: string): Promise<CareTeamMember[]> => {
      const response = await api.get(`/care-team/by-patient/${patientId}`);
      return response.data as CareTeamMember[];
    },*/

    getByPatient: async (patientId: string): Promise<CareTeamMember[]> => {
      const response = await api.get(`/care-team/by-patient/${patientId}`);
      return response.data as CareTeamMember[];
    },


    addToPatient: async (
      patientId: string,
      userId: string,
      name: string,
      role: string
    ): Promise<CareTeamMember> => {
      const response = await api.post(
        `/care-team/patient/${patientId}/member`,
        { userId, name, role }
      );
      return response.data as CareTeamMember;
    },

    removeFromPatient: async (
      patientId: string,
      userId: string
    ): Promise<void> => {
      await api.delete(`/care-team/patient/${patientId}/member/${userId}`);
    },

    update: async (
      id: string,
      memberData: Partial<CareTeamMember>
    ): Promise<CareTeamMember> => {
      const response = await api.put(`/care-team/${id}`, memberData);
      return response.data as CareTeamMember;
    },

    remove: async (id: string): Promise<void> => {
      await api.delete(`/care-team/${id}`);
    },
  },
};
