import { apiService } from "@/services/api";
import type { User } from "@/types/medical";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean; // Solo para verificación inicial de autenticación
    login: (email:string, password: string) => Promise<User>;
    logout: () => void;
    register: (userData: any) => Promise<any>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({children}: {children:React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    // isLoading solo se usa para la verificación inicial de autenticación
    // NO se modifica durante login/register para evitar conflictos con estados locales
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkAuthStatus = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                // No hay token, usuario no autenticado
                setUser(null)
                setIsLoading(false)
                return
            }
            
            // Verificar que el token sea válido
            const userData = await apiService.checkAuthStatus()
            setUser(userData)
            // Actualizar localStorage con datos frescos
            localStorage.setItem("user", JSON.stringify(userData))
        } catch (error: any) {
            // Token inválido o expirado, limpiar todo
            const errorMsg = error?.response?.data?.message || error?.message || 'Error verificando autenticación';
            console.error('Error verificando autenticación:', errorMsg)
            setUser(null)
            localStorage.removeItem("token")
            localStorage.removeItem("user")
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        // NO modificamos isLoading aquí - las páginas usan su propio estado local
        try {
            const data = await apiService.login(email, password)
            // Guardamos el token (puede venir como access_token o token)
            const token = (data as any).access_token || (data as any).token;
            
            if (!token) {
                throw new Error('No se recibió token de autenticación')
            }
            
            localStorage.setItem("token", token)
            
            // Obtener los datos completos del usuario
            const userData = await apiService.checkAuthStatus()
            
            // Guardar usuario en localStorage para acceso inmediato
            localStorage.setItem("user", JSON.stringify(userData))
            
            // Actualizar el estado del usuario
            setUser(userData)
            
            return userData
        } catch (error: any) {
            // Limpiar tokens si hay error
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setUser(null)
            throw error
        }
    }


    const register = async (userData: any) => {
        // NO modificamos isLoading aquí - las páginas usan su propio estado local
        try {
            // Preparación del registroData acordado para el CreateUserDto
            const registrationData = {
                email: userData.email,
                password: userData.password,
                name: userData.name,
                rut: userData.rut,
                role: userData.role
            }

            const registrationResponse = await apiService.register(registrationData)

            // Hace login automático después del registro
            await login(userData.email, userData.password)

            // Retorna la respuesta del registro para procesos adicionales
            return registrationResponse
        } catch (error: any) {
            throw error
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
    }

    const refreshUser = async () => {
        try {
            const userData = await apiService.checkAuthStatus()
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
        } catch (error) {
            console.error('Error refreshing user:', error)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                refreshUser,
                isAuthenticated: !!user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvide (Mensaje de src/context/AuthContext)")
    }
    return context
}

export { AuthContext, AuthProvider, useAuth}