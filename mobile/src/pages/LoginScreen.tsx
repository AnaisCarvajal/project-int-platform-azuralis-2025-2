import React, { useState } from "react";
import {View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { CancerRibbon } from "../components/CancerRibbon"; // asegúrate de tener versión RN o svg válido
//import LogoUCN from "../assets/icons/logo_ucn.svg";     
// <LogoUCN width={32} height={32} /> // si usas metro + svgr
import { Image } from "react-native";

export function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
  setError("");

  if (!email.trim()) {
    setError("Por favor ingresa tu correo electrónico");
    return;
  }
  if (!password) {
    setError("Por favor ingresa tu contraseña");
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    setError("Por favor ingresa un correo electrónico válido");
    return;
  }

  setIsLoading(true);
  try {
    // 🧩 logs para ver qué se está enviando realmente
    console.log("📧 Email enviado:", email.trim());
    console.log("🔑 Password enviado:", password);

    const response = await login(email.trim(), password);

    console.log("✅ Respuesta del backend:", response);

    // 👇 dependiendo del rol del usuario, redirigimos distinto
    if (response?.role === "doctor") {
      navigation.reset({
        index: 0,
        routes: [{ name: "DashboardClinicalStaff" as never }],
      });
    } else if (response?.role === "nurse") {
      navigation.reset({
        index: 0,
        routes: [{ name: "DashboardClinicalStaff" as never }],
      });
    } else if (response?.role === "guardian") {
      navigation.reset({
        index: 0,
        routes: [{ name: "DashboardGuardian" as never }],
      });
    } else {
      // paciente por defecto
      navigation.reset({
        index: 0,
        routes: [{ name: "HomePage" as never }],
      });
    }
  } catch (err: any) {
    console.log("❌ Error en login:", err.message);
    console.log("📡 Detalles del backend:", err.response?.data);

    if (err.response) {
      const status = err.response.status;
      const message = err.response.data?.message;
      if (status === 401)
        setError("Correo o contraseña incorrectos. Verifica tus credenciales.");
      else if (status === 404) setError("Usuario no encontrado.");
      else if (status === 403) setError("Cuenta bloqueada. Contacta al administrador.");
      else if (status === 500) setError("Error del servidor. Intenta más tarde.");
      else setError(message || "Error al iniciar sesión.");
    } else if (err.request) {
      setError("No se pudo conectar con el servidor. Revisa tu conexión.");
    } else {
      setError("Error inesperado. Intenta nuevamente.");
    }
  } finally {
    setIsLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <CancerRibbon size="lg" color="#ff6299" />
            <Image
              source={require("../assets/icons/logo_ucn.png")} // usa PNG o JPG
              style={{ width: 32, height: 32 }}
            />
          </View>
          <Text style={styles.title}>Ficha Médica Portátil</Text>
          <Text style={styles.subtitle}>Universidad Católica del Norte</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>
            Accede a tu información médica de forma segura.
          </Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            style={[
              styles.input,
              error && !password ? { borderColor: "#FCA5A5" } : {},
            ]}
            placeholder="ejemplo@ucn.cl"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError("");
            }}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
          <TextInput
            style={[
              styles.input,
              error && email ? { borderColor: "#FCA5A5" } : {},
            ]}
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError("");
            }}
          />

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate("Register" as never)}
          >
            <Text style={styles.registerText}>
              ¿No tienes cuenta?{" "}
              <Text style={styles.registerBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Sistema desarrollado para mejorar la atención oncológica.
          </Text>
          <Text style={styles.footerText}>© 2025 Azuralis</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  header: { alignItems: "center", marginBottom: 24 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginTop: 8 },
  subtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", textAlign: "center" },
  cardSubtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: "500", color: "#111827", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#F9FAFB",
  },
  errorText: { color: "#B91C1C", fontSize: 13, marginTop: 6 },
  loginBtn: {
    backgroundColor: "#fa8fb5",
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  registerLink: { marginTop: 12, alignItems: "center" },
  registerText: { color: "#6B7280", fontSize: 13 },
  registerBold: {
    color: "#fa8fb5",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: { color: "#1E3A8A", fontWeight: "700", marginBottom: 8 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  infoLabel: { color: "#1E40AF", fontWeight: "600", fontSize: 12 },
  infoValue: { color: "#1E3A8A", fontSize: 12 },
  infoFooter: {
    fontSize: 11,
    color: "#1E40AF",
    marginTop: 8,
    fontStyle: "italic",
  },
  footer: { alignItems: "center", marginTop: 8 },
  footerText: { color: "#6B7280", fontSize: 12 },
});
