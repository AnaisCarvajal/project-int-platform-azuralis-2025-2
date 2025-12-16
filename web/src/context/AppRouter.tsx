import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardClinicalStaff } from "../pages/ClinicalStaff/DashboardClinicalStaff";
import { DashboardPatient } from "../pages/Patient/DashboardPatient";
import { DashboardGuardian } from "../pages/Guardian/DashboardGuardian";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { HomePage } from "../pages/HomePage";
import { RegisterScreen } from "../pages/RegisterScreen";
import { EmergencyAccess } from "../pages/EmergencyAccess";
import { ForgotPasswordScreen } from "../pages/ForgotPasswordScreen";
import { ResetPasswordScreen } from "../pages/ResetPasswordScreen";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública - Login (o redirige a dashboard si está autenticado) */}
                <Route path="/" element={<HomePage />} />

                {/* Ruta pública - Registro */}
                <Route path="/register" element={<RegisterScreen />} />

                {/* Ruta pública - Recuperación de contraseña */}
                <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                <Route path="/reset-password" element={<ResetPasswordScreen />} />

                {/* Ruta pública - Acceso de emergencia vía QR (SIN AUTENTICACIÓN) */}
                <Route path="/emergency/:qrCode" element={<EmergencyAccess />} />

                {/* Rutas protegidas - Dashboards */}
                {/* Dashboard unificado para Doctor y Enfermera */}
                <Route
                    path="/dashboard-doctor"
                    element={
                        <ProtectedRoute>
                            <DashboardClinicalStaff />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard-nurse"
                    element={
                        <ProtectedRoute>
                            <DashboardClinicalStaff />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard-patient"
                    element={
                        <ProtectedRoute>
                            <DashboardPatient />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard-guardian"
                    element={
                        <ProtectedRoute>
                            <DashboardGuardian />
                        </ProtectedRoute>
                    }
                />

                {/* Ruta 404 - Redirigir al inicio */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
