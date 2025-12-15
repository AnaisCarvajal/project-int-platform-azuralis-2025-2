import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "../services/api";
import type { User, UserRole } from "../types/medical";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: RegisterFormData) => Promise<any>;
}

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  rut: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // =====================================================
  // 🧩 Verificar autenticación al iniciar la app
  // =====================================================
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const userData: User = await apiService.checkAuthStatus(token);
      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error verificando autenticación:", error);
      setUser(null);
      await AsyncStorage.multiRemove(["token", "user"]);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 🧩 Login
  // =====================================================
  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await apiService.login(email, password);
      const token = data.access_token;

      // Guardar token
      await AsyncStorage.setItem("token", token);

      // Obtener datos del usuario autenticado
      const userData: User = await apiService.checkAuthStatus(token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 🧩 Registro
  // =====================================================
  const register = async (userData: RegisterFormData): Promise<any> => {
    setIsLoading(true);
    try {
      const registrationResponse = await apiService.register(userData);

      // Iniciar sesión automáticamente tras el registro
      await login(userData.email, userData.password);

      return registrationResponse;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 🧩 Logout
  // =====================================================
  const logout = async (): Promise<void> => {
    setUser(null);
    await AsyncStorage.multiRemove(["token", "user"]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// 🧩 Custom Hook
// =====================================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth debe ser usado dentro de un AuthProvider (src/context/AuthContext)"
    );
  }
  return context;
};
