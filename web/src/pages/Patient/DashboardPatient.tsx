import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { patientTabs } from "@/common/config/navigationTabs";
import { HomePatient } from "./Home";
import { NotesPatient } from "./Notes";
import { DocumentsPatient } from "./Documents";
import { usePatientData } from "@/hooks/usePatientData";
import { ProfilePatient } from "./Profile";
import { apiService } from "@/services/api";

export function DashboardPatient() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('home');
    const { cancerColor } = usePatientData();
    const [patientPhoto, setPatientPhoto] = useState<string | null>(null);

    // Cargar foto del paciente
    useEffect(() => {
        const loadPatientPhoto = async () => {
            if (user?.id) {
                try {
                    const photoData = await apiService.users.getProfilePicture(user.id);
                    console.log('📸 Foto de perfil cargada en header:', photoData);
                    if (photoData?.url) {
                        setPatientPhoto(photoData.url);
                    }
                } catch (error) {
                    console.log('Error al cargar foto del paciente:', error);
                }
            }
        };
        loadPatientPhoto();
    }, [user?.id]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const onTabChange = (tabId: string) => {
        setActiveTab(tabId);
    };

    // Función para renderizar el contenido según la tab activa
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return(<HomePatient onTabChange={onTabChange} />);
            case 'notes':
                return (<NotesPatient/>);
            case 'documents':
                return (<DocumentsPatient/>);
            case 'profile':
                return (<ProfilePatient/>);
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 pb-20">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header mejorado */}
                    <div 
                        className="relative overflow-hidden p-6 md:p-8 text-white"
                        style={{
                            background: `linear-gradient(135deg, ${cancerColor.color} 0%, ${cancerColor.color}dd 100%)`
                        }}
                    >
                        <div 
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }}
                        />
                        <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                            <div className="flex items-center space-x-4">
                                {/* Avatar del paciente */}
                                <div className="relative">
                                    <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm"></div>
                                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/30 relative">
                                        <AvatarImage src={patientPhoto || undefined} alt={user?.name} />
                                    </Avatar>
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold">
                                        Ficha Médica Portátil
                                    </h1>
                                    <p className="text-white/90 text-sm md:text-base mt-1">
                                        {user?.name || 'Cargando...'}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleLogout} 
                                variant="outline"
                                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    />
                                </svg>
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                    
                    {/* Contenido dinámico según tab activa */}
                    <div className="p-4 md:p-6">
                        {renderContent()}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                accentColor={cancerColor.color}
                tabs={patientTabs}
            />
        </div>
    );
}
