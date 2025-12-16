import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { Stethoscope } from "lucide-react-native";
import { api } from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";


interface CompleteNurseProfileProps {
  onComplete: () => void;
}

export const CompleteNurseProfile = ({ onComplete }: CompleteNurseProfileProps) => {
  const { user, setUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const [formData, setFormData] = useState({
    department: "",
    license: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.department.trim() || !formData.license.trim()) {
      setError("Por favor, completa todos los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error("Usuario no autenticado");
      }
      console.log("ID de Usuario a actualizar:", user.id);
      console.log("Datos a enviar:", formData);

      await api.put(`/users/${user.id}`, {
      department: formData.department.trim(),
      license: formData.license.trim(),
      });

      // 👇 volver a pedir el usuario actualizado
      const updatedUser = await apiService.getProfile(user.id);
      // 👇 actualizar el contexto
      setUser(updatedUser);
      onComplete();

    } catch (err: any) {
      console.error("Error al completar perfil:", err);
      setError(
        err?.response?.data?.message ||
          "Error al actualizar el perfil. Por favor, intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTitleRow}>
          <Stethoscope color="#0891B2" size={24} />
          <Text style={styles.headerTitle}>Completa tu Perfil de Enfermera</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Por favor, proporciona la siguiente información profesional para activar tu cuenta.
        </Text>
      </View>

      {/* Formulario */}
      <View style={styles.formCard}>
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>
          Departamento <Text style={{ color: "#DC2626" }}>*</Text>
        </Text>
        <TextInput
          value={formData.department}
          onChangeText={(v) => handleChange("department", v)}
          style={styles.input}
          placeholder="Ej: Oncología, Cuidados Intensivos, Pediatría"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>
          Número de Licencia Profesional <Text style={{ color: "#DC2626" }}>*</Text>
        </Text>
        <TextInput
          value={formData.license}
          onChangeText={(v) => handleChange("license", v)}
          style={styles.input}
          placeholder="Ej: RN-12345"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            { backgroundColor: isSubmitting ? "#93C5FD" : "#0EA5E9" },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Completar Perfil</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Adicional */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Información Profesional</Text>
        <Text style={styles.infoText}>
          Estos datos serán visibles para los pacientes y te identificarán como profesional
          de enfermería certificado en la plataforma.
        </Text>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F0F9FF", // fondo azulado
    flexGrow: 1,
  },
  headerCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0C4A6E",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#475569",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#E0F2FE",
    borderColor: "#7DD3FC",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
  },
  screen: { flex: 1, backgroundColor: "#F3F4F6" }
});
