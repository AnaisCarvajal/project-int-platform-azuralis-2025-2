import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,} from "react-native";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { User, AlertCircle, FileText, Phone } from "lucide-react-native";
import { Step1, Step2, Step3 } from "../pages/Patient/steps/CompleteProfileSteps";
import { CancerType } from "../types/medical";

export function CompleteProfileForm({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    dateOfBirth: "",
    diagnosis: "",
    stage: "",
    cancerType: "",
    allergies: "",
    currentMedications: "",
    treatmentSummary: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
  });



  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
  setLoading(true);
  setError("");

  try {
    const allergiesArray = formData.allergies
      ? formData.allergies.split(",").map(a => a.trim()).filter(Boolean)
      : [];

    const medicationsArray = formData.currentMedications
      ? formData.currentMedications.split(",").map(m => m.trim()).filter(Boolean)
      : [];

    // 1️⃣ Crear paciente (SIN emergencyContacts)
    const createdPatient = await apiService.patients.create({
      name: user?.name || "",
      rut: user?.rut || "",
      dateOfBirth: formData.dateOfBirth,
      diagnosis: formData.diagnosis,
      stage: formData.stage,
      cancerType: formData.cancerType as CancerType,
      allergies: allergiesArray,
      currentMedications: medicationsArray,
      treatmentSummary: formData.treatmentSummary,
    });

    if (formData.emergencyContactName?.trim()) {
      await apiService.patients.update(createdPatient.id, {
        emergencyContacts: [
          {
            name: formData.emergencyContactName.trim(),
            relationship: formData.emergencyContactRelationship?.trim() || "",
            phone: formData.emergencyContactPhone?.trim() || "",
          },
        ],
      });
    }

    onComplete();
  } catch (err: any) {
    console.error("Error al crear perfil:", err);
    setError(
      err.response?.data?.message ||
        "Error al guardar los datos. Por favor intenta nuevamente."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerTitleRow}>
              <User color="#7C3AED" size={24} />
              <Text style={styles.headerTitle}>Completa tu Perfil Médico</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Para poder usar todas las funcionalidades de la aplicación,
              necesitamos algunos datos sobre tu condición médica.
            </Text>
          </View>

          {/* Indicador de pasos */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((num) => (
              <View key={num} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    step === num
                      ? styles.stepActive
                      : step > num
                      ? styles.stepDone
                      : styles.stepPending,
                  ]}
                >
                  <Text style={styles.stepText}>
                    {step > num ? "✓" : num.toString()}
                  </Text>
                </View>
                {num < 3 && (
                  <View
                    style={[
                      styles.stepLine,
                      step > num ? styles.stepLineActive : styles.stepLinePending,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Contenido dinámico */}
          <View style={styles.formCard}>
            {step === 1 && (
              <Step1
                formData={formData}
                handleChange={handleChange}
                setStep={setStep}
              />
            )}
            {step === 2 && (
              <Step2
                formData={formData}
                handleChange={handleChange}
                setStep={setStep}
              />
            )}
            {step === 3 && (
              <Step3
                formData={formData}
                handleChange={handleChange}
                setStep={setStep}
                handleSubmit={handleSubmit}
                loading={loading}
                error={error}
              />
            )}
          </View>

          {/* Info boxes */}
          <View style={styles.infoCards}>
            <View style={[styles.infoCard, { backgroundColor: "#EFF6FF" }]}>
              <AlertCircle color="#2563EB" size={28} />
              <Text style={styles.infoCardText}>
                Tus datos están protegidos y solo los verá tu equipo médico
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: "#DCFCE7" }]}>
              <FileText color="#16A34A" size={28} />
              <Text style={styles.infoCardText}>
                Podrás editar esta información desde tu perfil
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: "#F3E8FF" }]}>
              <Phone color="#7C3AED" size={28} />
              <Text style={styles.infoCardText}>
                Se generará tu código QR único para emergencias
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ---------- ESTILOS ----------
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
    marginTop: 6,
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 16,
  },
  stepItem: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: { backgroundColor: "#7C3AED" },
  stepDone: { backgroundColor: "#16A34A" },
  stepPending: { backgroundColor: "#E5E7EB" },
  stepText: { color: "white", fontWeight: "600" },
  stepLine: { width: 32, height: 3, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#16A34A" },
  stepLinePending: { backgroundColor: "#E5E7EB" },
  infoCards: { marginTop: 24, gap: 12 },
  infoCard: { borderRadius: 12, padding: 16, alignItems: "center" },
  infoCardText: {
    textAlign: "center",
    fontSize: 12,
    color: "#374151",
    marginTop: 6,
  },
});
