import { apiService } from "@/services/api";
import type { User } from "@/types/medical";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email:string, password: string) => Promise<User>;
    logout: () => void;
    register: (userData: any) => Promise<any>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({children}: {children:React.ReactNode}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
        } catch (error) {
            // Token inválido o expirado, limpiar todo
            console.error('Error verificando autenticación:', error)
            setUser(null)
            localStorage.removeItem("token")
            localStorage.removeItem("user")
        } finally {
            setIsLoading(false)
        }
    }

    const login = async (email: string, password: string) => {
        setIsLoading(true)
        try {
            const data = await apiService.login(email, password)
            // Guardamos el token (puede venir como access_token o token)
            const token = (data as any).access_token || (data as any).token;
            localStorage.setItem("token", token)
            
            // Obtener los datos completos del usuario
            const userData = await apiService.checkAuthStatus()
            
            // Guardar usuario en localStorage para acceso inmediato
            localStorage.setItem("user", JSON.stringify(userData))
            
            // Actualizar el estado del usuario
            setUser(userData)
            setIsLoading(false)
            
            return userData
        } catch (error) {
            setIsLoading(false)
            throw error
        }
    }


    const register = async (userData: any) => {
        setIsLoading(true)
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
        } catch (error) {
            throw error
        } finally {
            setIsLoading(false)
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