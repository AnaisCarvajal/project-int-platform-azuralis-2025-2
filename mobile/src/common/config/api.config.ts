
const ENV = process.env.EXPO_PUBLIC_ENV || "development";

export const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    (ENV === "web"
      ? "http://localhost:3000"
      : "http://192.168.1.91:3000"),  // <- cambiar la api
  TIMEOUT: 30000,
  WITH_CREDENTIALS: true,
};

console.log("🌍 API BASE_URL:", API_CONFIG.BASE_URL);
console.log("🔧 ENV:", ENV);

// 🔹 Endpoints iguales a los del web (pueden reutilizarse)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    CHECK_STATUS: "/auth/check-status",
  },
  PATIENTS: {
    BASE: "/patients",
    BY_ID: (id: string) => `/patients/${id}`,
    QR: (id: string) => `/patients/${id}/qr`,
  },
  NOTES: {
    BASE: "/patient-notes",
    BY_ID: (id: string) => `/patient-notes/${id}`,
  },
  DOCUMENTS: {
    BASE: "/patient-documents",
    BY_ID: (id: string) => `/patient-documents/${id}`,
  },
  CARE_TEAM: {
    BASE: "/care-team",
    BY_ID: (id: string) => `/care-team/${id}`,
    BY_PATIENT: (patientId: string) => `/care-team/by-patient/${patientId}`,
  },
};
