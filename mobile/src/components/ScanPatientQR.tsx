import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import type { Patient } from "../types/medical";

interface ScanPatientQRProps {
  onPatientFound: (patient: Patient) => void;
  onBack: () => void;
}

export function ScanPatientQR({ onPatientFound, onBack }: ScanPatientQRProps) {
  const { user } = useAuth();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🎥 Permisos de cámara
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;

    setScanned(true);
    setLoading(true);

    try {
      // 🔑 El QR contiene el ID del paciente
      let patientId = data.trim();

      // Caso 1: QR viene como URL con prefijo PATIENT:
      if (patientId.includes("PATIENT:")) {
        patientId = patientId.split("PATIENT:")[1];
      }

      // Caso 2: QR viene como URL completa /patients/{id}
      if (patientId.includes("/patients/")) {
        patientId = patientId.split("/patients/")[1];
      }

      // Validación final
      if (!patientId || patientId.length < 10) {
        throw new Error("QR inválido: no se pudo extraer el ID del paciente");
      }

      console.log("🧩 Patient ID extraído:", patientId);


      // 🔍 Buscar paciente por ID
      const response = await apiService.patients.getById(patientId);
      const patient = response.data as Patient;

      // 🕒 Guardar historial (mismo comportamiento que web)
      if (user && (user.role === "doctor" || user.role === "nurse")) {
        try {
          await apiService.users.addSearchHistory(
            user.id,
            patient.id,
            patient.rut
          );
        } catch {
          // Error secundario, no bloquea el flujo
        }
      }

      onPatientFound(patient);
    } catch (error) {
      console.error("❌ Error al escanear QR:", error);
      Alert.alert(
        "Error",
        "No se pudo leer el QR o el paciente no existe.",
        [
          {
            text: "Intentar nuevamente",
            onPress: () => setScanned(false),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Permisos
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Solicitando permiso de cámara…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          No se otorgó permiso para usar la cámara
        </Text>
        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        <Text style={styles.title}>Escanear QR del Paciente</Text>
        <Text style={styles.subtitle}>
          Apunta la cámara al código QR de la ficha del paciente
        </Text>

        {loading && <ActivityIndicator size="large" color="#fff" />}

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "space-between",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 40,
    textAlign: "center",
  },
  subtitle: {
    color: "#ddd",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  backButton: {
    alignSelf: "center",
    marginBottom: 40,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: "600",
    color: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
  },
});
