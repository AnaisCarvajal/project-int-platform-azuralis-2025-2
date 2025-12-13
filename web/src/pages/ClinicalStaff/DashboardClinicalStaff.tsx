import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { clinicalStaffTabs } from "@/common/config/navigationTabs";
import type { DoctorUser, NurseUser, Patient } from "@/types/medical";
import { SearchPatientByRut } from "@/components/SearchPatientByRut";
import { EditablePatientRecord } from "@/components/EditablePatientRecord";
import { Button } from "@/components/ui/button";
import { CompleteDoctorProfile } from "@/components/CompleteDoctorProfile";
import { CompleteNurseProfile } from "@/components/CompleteNurseProfile";
import { CareTeamPatientsList } from "@/components/CareTeamPatientsList";
import { EditableClinicalProfile } from "@/pages/ClinicalStaff/EditableProfile";
import { apiService } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stats {
  totalPatients: number;
  searchHistory: number;
  myPatients: number;
}

export function DashboardClinicalStaff() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    searchHistory: 0,
    myPatients: 0,
  });
  const [userPhoto, setUserPhoto] = useState<any>(null);

  const isDoctor = user?.role === "doctor";
  const isNurse = user?.role === "nurse";
  const accentColor = isDoctor ? "#001663" : "#00B4D8";
  const roleLabel = isDoctor ? "Médico/a" : "Enfermera";

  // Load user profile picture
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user?.id) {
        try {
          const photoData = await apiService.users.getProfilePicture(user.id);
          setUserPhoto(photoData);
        } catch (error) {
          console.log('No profile picture found');
        }
      }
    };
    loadUserPhoto();
  }, [user?.id]);

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user || (!isDoctor && !isNurse)) return;

      try {
        const allPatients = await apiService.patients.getAll();
        const clinicalUser = user as DoctorUser | NurseUser;

        const myPatients = allPatients.filter((patient: Patient) =>
          patient.careTeam?.some((member) => {
            // La comparación ahora es insensible a mayúsculas/minúsculas
            return member.userId.toLowerCase() === user.id.toLowerCase();
          })
        );

        setStats({
          totalPatients: allPatients.length,
          searchHistory: clinicalUser.searchHistory?.length || 0,
          myPatients: myPatients.length,
        });
      } catch (error) {
        console.error("Error loading statistics:", error);
        setStats({ totalPatients: 0, searchHistory: 0, myPatients: 0 });
      }
    };

    if (!needsProfileCompletion) {
      loadStats();
    }
  }, [user, needsProfileCompletion, isDoctor, isNurse]);

  // Handle profile completion
  const handleProfileComplete = () => {
    setNeedsProfileCompletion(false);
    window.location.reload();
  };

  // Show profile completion form if needed
  if (needsProfileCompletion) {
    return isDoctor ? (
      <CompleteDoctorProfile onComplete={handleProfileComplete} />
    ) : (
      <CompleteNurseProfile onComplete={handleProfileComplete} />
    );
  }

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId); // Siempre actualizar el tab activo

    if (tabId === "search") {
      setShowSearch(true);
      setSelectedPatient(null);
    } else {
      setShowSearch(false);
      setSelectedPatient(null);
    }
  };

  const handlePatientFound = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowSearch(false);

    // Guardar en historial de búsquedas
    try {
      // TODO: HECHO, NO TOCAR
      console.log("Paciente encontrado:", patient.id, patient.rut);
    } catch (error) {
      console.error("Error al guardar historial:", error);
    }
  };

  const handleBackFromSearch = () => {
    setShowSearch(false);
    setActiveTab("home");
  };

  const handleBackFromRecord = () => {
    setSelectedPatient(null);
    setActiveTab("careTeam");
  };

  // Si está buscando, mostrar el buscador CON bottom navigation
  if (showSearch) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SearchPatientByRut
          onPatientFound={handlePatientFound}
          onBack={handleBackFromSearch}
        />
        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          accentColor={accentColor}
          tabs={clinicalStaffTabs}
        />
      </div>
    );
  }

  // Si seleccionó un paciente, mostrar su ficha CON bottom navigation
  if (selectedPatient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <EditablePatientRecord
          patient={selectedPatient}
          onBack={handleBackFromRecord}
        />
        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          accentColor={accentColor}
          tabs={clinicalStaffTabs}
        />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div className="mt-8 space-y-6">
            {/* Bienvenida mejorada */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              />
              <Card 
                className="border-0"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 50%, ${accentColor}aa 100%)`
                }}
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="text-white flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h2 className="text-3xl font-bold">
                          ¡Bienvenido de vuelta!
                        </h2>
                      </div>
                      <p className="text-white/90 text-lg ml-15">
                        Panel de {roleLabel} - Ficha Médica Portátil Lacito
                      </p>
                      <div className="mt-4 flex items-center space-x-4 ml-15">
                        <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                          <p className="text-sm font-medium">
                            {new Date().toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <svg
                          className="w-20 h-20 text-white/80"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estadísticas mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                          Mis Pacientes
                        </p>
                      </div>
                      <p className="text-4xl font-bold text-blue-900 mb-1">
                        {stats.myPatients}
                      </p>
                      <p className="text-sm text-blue-600">
                        {stats.myPatients === 1 ? 'Paciente asignado' : 'Pacientes asignados'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-emerald-50 via-emerald-50 to-emerald-100">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                          Búsquedas
                        </p>
                      </div>
                      <p className="text-4xl font-bold text-emerald-900 mb-1">
                        {stats.searchHistory}
                      </p>
                      <p className="text-sm text-emerald-600">
                        Registros consultados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-violet-50 via-violet-50 to-violet-100">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-violet-700 uppercase tracking-wide">
                          Pacientes Totales
                        </p>
                      </div>
                      <p className="text-4xl font-bold text-violet-900 mb-1">
                        {stats.totalPatients}
                      </p>
                      <p className="text-sm text-violet-600">
                        Pacientes registrados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones Rápidas mejoradas */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Acciones Rápidas
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => onTabChange("search")}
                    className="h-auto py-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`
                    }}
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-lg">Buscar Paciente</p>
                        <p className="text-sm text-white/80">
                          Consultar ficha médica por RUT
                        </p>
                      </div>
                      <svg
                        className="w-6 h-6 text-white/60"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Button>

                  <Button
                    onClick={() => onTabChange("careTeam")}
                    variant="outline"
                    className="h-auto py-6 border-2 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:border-gray-400"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-7 h-7 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold text-lg text-gray-900">
                          Equipo de Cuidados
                        </p>
                        <p className="text-sm text-gray-600">
                          Ver mis pacientes asignados
                        </p>
                      </div>
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "careTeam":
        return (
          <div className="mt-8">
            <CareTeamPatientsList onPatientSelect={setSelectedPatient} />
          </div>
        );

      case "profile":
        return <EditableClinicalProfile />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 pb-20">
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Header con Avatar mejorado */}
          <div className="relative overflow-hidden rounded-2xl shadow-lg mb-6">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`
              }}
            />
            <div
              className="p-8 text-white relative"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm"></div>
                    <Avatar className="w-24 h-24 border-4 border-white/30 relative">
                      <AvatarImage src={userPhoto?.url} alt={user?.name} />
                      <AvatarFallback 
                        className="text-4xl font-bold" 
                        style={{ backgroundColor: 'white', color: accentColor }}
                      >
                        {user?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{user?.name}</h2>
                    <div className="space-y-1">
                      <p className="text-white/90 text-base flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {isDoctor
                            ? `${(user as DoctorUser).specialization}`
                            : `${(user as NurseUser).department}`}
                        </span>
                      </p>
                      <p className="text-white/80 text-sm flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{user?.email}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido dinámico */}
          {renderContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        accentColor={accentColor}
        tabs={clinicalStaffTabs}
      />
    </div>
  );
}
