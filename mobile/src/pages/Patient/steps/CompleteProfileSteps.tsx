import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { cancerColors, type CancerType } from "../../../types/medical";

// ✅ INTERFAZ para las props de los Steps
interface StepProps {
  formData: {
    dateOfBirth: string;
    diagnosis: string;
    stage: string;
    cancerType: CancerType | string;
    allergies: string;
    currentMedications: string;
    treatmentSummary: string;
    emergencyContactName: string;
    emergencyContactRelationship: string;
    emergencyContactPhone: string;
  };
  handleChange: (field: keyof StepProps["formData"], value: string) => void;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  handleSubmit?: () => void;
  loading?: boolean;
  error?: string;
}


// 🩺 STEP 1
export const Step1 = React.memo(({ formData, handleChange, setStep }: StepProps) => (
  <View>
    <Text style={styles.label}>Fecha de Nacimiento *</Text>
    <TextInput
      style={styles.input}
      placeholder="AAAA-MM-DD"
      value={formData.dateOfBirth}
      onChangeText={(v) => handleChange("dateOfBirth", v)}
    />

    <Text style={styles.label}>Diagnóstico *</Text>
    <TextInput
      style={styles.input}
      value={formData.diagnosis}
      onChangeText={(v) => handleChange("diagnosis", v)}
      placeholder="Ej: Cáncer de mama"
    />

    <Text style={styles.label}>Etapa / Estadio *</Text>
    <TextInput
      style={styles.input}
      value={formData.stage}
      onChangeText={(v) => handleChange("stage", v)}
      placeholder="Ej: Etapa II"
    />

    <Text style={styles.label}>Tipo de cáncer *</Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={formData.cancerType}
        onValueChange={(v) => handleChange("cancerType", v)}
      >
        <Picker.Item label="Selecciona el tipo de cáncer" value="" />
        {Object.entries(cancerColors).map(([key, config]) => (
          <Picker.Item key={key} label={config.name} value={key} />
        ))}
      </Picker>
    </View>

    <TouchableOpacity
      style={[
        styles.nextButton,
        {
          backgroundColor:
            !formData.dateOfBirth ||
            !formData.diagnosis ||
            !formData.stage ||
            !formData.cancerType
              ? "#93C5FD"
              : "#7C3AED",
        },
      ]}
      disabled={
        !formData.dateOfBirth ||
        !formData.diagnosis ||
        !formData.stage ||
        !formData.cancerType
      }
      onPress={() => setStep(2)}
    >
      <Text style={styles.nextButtonText}>Siguiente</Text>
    </TouchableOpacity>
  </View>
));

// 🧪 STEP 2
export const Step2 = React.memo(({ formData, handleChange, setStep }: StepProps) => (
  <View>
    <Text style={styles.label}>Alergias</Text>
    <TextInput
      style={styles.input}
      value={formData.allergies}
      onChangeText={(v) => handleChange("allergies", v)}
      placeholder="Ej: Penicilina, Ibuprofeno"
    />
    <Text style={styles.helper}>Separa múltiples alergias con comas</Text>

    <Text style={styles.label}>Medicamentos actuales</Text>
    <TextInput
      style={[styles.input, { height: 80, textAlignVertical: "top" }]}
      multiline
      value={formData.currentMedications}
      onChangeText={(v) => handleChange("currentMedications", v)}
      placeholder="Ej: Tamoxifeno 20mg - cada 12h"
    />

    <Text style={styles.label}>Resumen de tratamiento</Text>
    <TextInput
      style={[styles.input, { height: 100, textAlignVertical: "top" }]}
      multiline
      value={formData.treatmentSummary}
      onChangeText={(v) => handleChange("treatmentSummary", v)}
      placeholder="Describe brevemente tu tratamiento..."
    />

    <View style={styles.stepButtons}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <Text style={styles.backButtonText}>Atrás</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.nextButton} onPress={() => setStep(3)}>
        <Text style={styles.nextButtonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  </View>
));

// 🚑 STEP 3
export const Step3 = React.memo(
  ({ formData, handleChange, setStep, handleSubmit, loading, error }: StepProps) => (
    <View>
      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          <Text style={{ fontWeight: "bold" }}>Contacto de emergencia</Text> — Opcional pero recomendado
        </Text>
      </View>

      <Text style={styles.label}>Nombre del contacto</Text>
      <TextInput
        style={styles.input}
        value={formData.emergencyContactName}
        onChangeText={(v) => handleChange("emergencyContactName", v)}
        placeholder="Ej: María García"
      />

      <Text style={styles.label}>Relación</Text>
      <TextInput
        style={styles.input}
        value={formData.emergencyContactRelationship}
        onChangeText={(v) => handleChange("emergencyContactRelationship", v)}
        placeholder="Ej: Hermana, Esposo/a"
      />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={formData.emergencyContactPhone}
        onChangeText={(v) => handleChange("emergencyContactPhone", v)}
        placeholder="Ej: +56 9 1234 5678"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.nextButtonText}>
            {loading ? "Guardando..." : "Completar Perfil"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
);

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "500", color: "#111827", marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#F9FAFB",
    color: "#111827",
  },
  helper: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    marginBottom: 10,
  },
  stepButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  nextButton: { flex: 1, backgroundColor: "#7C3AED", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  backButton: { flex: 1, backgroundColor: "#E5E7EB", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginRight: 8 },
  submitButton: { flex: 1, backgroundColor: "#7C3AED", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  nextButtonText: { color: "white", fontWeight: "600" },
  backButtonText: { color: "#374151", fontWeight: "600" },
  infoBox: { backgroundColor: "#DBEAFE", padding: 10, borderRadius: 8, marginBottom: 10 },
  infoBoxText: { fontSize: 13, color: "#1E3A8A" },
  errorText: { color: "#B91C1C", marginTop: 8 },
});
