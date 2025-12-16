import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { Stethoscope, Award } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CompleteDoctorProfileProps {
  onComplete: () => void;
}

export function CompleteDoctorProfile({ onComplete }: CompleteDoctorProfileProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    specialization: "",
    license: "",
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.specialization || !formData.license) return;

    setLoading(true);
    setError("");

    try {
      await apiService.users.update(user!.id, {
        specialization: formData.specialization,
        license: formData.license,
      });
      onComplete();
    } catch (err: any) {
      console.error("Error al completar perfil:", err);
      setError(
        err?.response?.data?.message ||
          "Error al guardar los datos. Por favor intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTitleRow}>
          <Stethoscope color="#2563EB" size={24} />
          <Text style={styles.headerTitle}>Completa tu Perfil Profesional</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Para completar tu registro como médico, necesitamos algunos datos
          profesionales.
        </Text>
      </View>

      {/* Formulario */}
      <View style={styles.formCard}>
        <Text style={styles.label}>Especialización *</Text>
        <TextInput
          value={formData.specialization}
          onChangeText={(v) => handleChange("specialization", v)}
          style={styles.input}
          placeholder="Ej: Oncología, Cirugía Oncológica"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.helperText}>
          Tu área de especialización médica
        </Text>

        <Text style={[styles.label, { marginTop: 16 }]}>
          Número de Licencia Médica *
        </Text>
        <TextInput
          value={formData.license}
          onChangeText={(v) => handleChange("license", v)}
          style={styles.input}
          placeholder="Ej: MED-12345"
          placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.helperText}>
          Tu número de registro médico profesional
        </Text>

        {error !== "" && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || !formData.specialization || !formData.license}
          style={[
            styles.submitButton,
            {
              backgroundColor:
                loading || !formData.specialization || !formData.license
                  ? "#93C5FD"
                  : "#2563EB",
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Completar Perfil</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info adicional */}
      <View style={styles.infoCard}>
        <Award color="#2563EB" size={28} style={{ marginBottom: 8 }} />
        <Text style={styles.infoTitle}>Información Profesional</Text>
        <Text style={styles.infoText}>
          Estos datos serán visibles para los pacientes y te identificarán como
          médico certificado en la plataforma.
        </Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#F9FAFB",
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
    marginBottom: 6,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#4B5563",
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
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
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
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
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
    color: "#4B5563",
    textAlign: "center",
  },
  screen: { flex: 1, backgroundColor: "#F3F4F6" }
});
