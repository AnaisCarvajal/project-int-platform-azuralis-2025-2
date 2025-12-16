import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "./context/AuthContext";

// 🔹 Páginas
import { LoginScreen } from "./pages/LoginScreen";
import { HomePage } from "./pages/HomePage";
import { RegisterScreen } from "./pages/RegisterScreen";
import { DashboardClinicalStaff } from "./pages/ClinicalStaff/DashboardClinicalStaff";
import { DashboardPatient } from "./pages/Patient/DashboardPatient";
import { DashboardGuardian } from "./pages/Guardian/DashboardGuardian";

import type { UserRole } from "./types/medical";

// ======================================================
// 🔹 Función para obtener la ruta del dashboard según el rol
// ======================================================
const getDashboardRoute = (role: UserRole): keyof RootStackParamList => {
  switch (role) {
    case "doctor":
      return "DashboardClinicalStaff";
    case "nurse":
      return "DashboardClinicalStaff";
    case "patient":
      return "DashboardPatient";
    case "guardian":
      return "DashboardGuardian";
    default:
      return "Login";
  }
};

// ======================================================
// 🔹 Tipado del stack
// ======================================================
export type RootStackParamList = {
  Login: undefined;
  HomePage: undefined;
  Register: undefined;
  DashboardClinicalStaff: undefined;
  DashboardPatient: undefined;
  DashboardGuardian: undefined;
};

// ======================================================
// 🔹 Stack Navigator
// ======================================================
const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 🌀 Mientras carga la sesión
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#fa8fb5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated && user ? getDashboardRoute(user.role) : "Login"}
        screenOptions={{ headerShown: false }}
      >
        {/* 🔓 Rutas públicas */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="HomePage" component={HomePage} />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* 🔒 Rutas protegidas (solo si hay sesión activa) */}
        {isAuthenticated && (
          <>
            <Stack.Screen name="DashboardClinicalStaff" component={DashboardClinicalStaff} />
            <Stack.Screen name="DashboardPatient" component={DashboardPatient} />
            <Stack.Screen name="DashboardGuardian" component={DashboardGuardian} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}