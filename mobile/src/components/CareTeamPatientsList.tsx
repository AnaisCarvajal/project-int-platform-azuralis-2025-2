import React, { useState, useEffect } from "react";
import {View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, StyleSheet,} from "react-native";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import type { Patient } from "../types/medical";
import { cancerColors } from "../types/medical";
import { Users, ChevronRight } from "lucide-react-native";
import { CancerRibbon } from "./CancerRibbon";
import { calculateAge } from "../common/helpers/CalculateAge";

interface CareTeamPatientsListProps {
  onPatientSelect: (patient: Patient) => void;
}

export function CareTeamPatientsList({ onPatientSelect }: CareTeamPatientsListProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCareTeamPatients();
  }, []);

  const loadMyCareTeamPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const myPatients = await apiService.patients.getMyCareTeam();
      setPatients(myPatients);
    } catch (err) {
      console.error("Error al cargar pacientes:", err);
      setError("Error al cargar los pacientes.");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------- ESTADOS DE CARGA ---------------------
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando pacientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, { backgroundColor: "#FEE2E2" }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadMyCareTeamPatients} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (patients.length === 0) {
    return (
      <View style={styles.card}>
        <Users color="#9CA3AF" size={48} style={{ alignSelf: "center", marginBottom: 12 }} />
        <Text style={styles.emptyTitle}>No tienes pacientes asignados</Text>
        <Text style={styles.emptyText}>
          Actualmente no formas parte del equipo de cuidados de ningún paciente.
        </Text>
      </View>
    );
  }

  // --------------------- LISTADO DE PACIENTES ---------------------
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Mi Equipo de Cuidados</Text>
        <Text style={styles.headerCount}>
          {patients.length} {patients.length === 1 ? "paciente" : "pacientes"}
        </Text>
      </View>

      {patients.map((patient) => {
        const cancerInfo = cancerColors[patient.cancerType];
        const myRole = patient.careTeam?.find((m) => m.userId === user?.id)?.role;

        return (
          <TouchableOpacity
            key={patient.id}
            style={[styles.patientCard, { borderColor: `${cancerInfo.color}40` }]}
            onPress={() => onPatientSelect(patient)}
          >
            <View style={styles.patientHeader}>
              <View style={styles.patientRow}>
                {patient.photo ? (
                  <Image
                    source={{ uri: patient.photo }}
                    style={styles.patientImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.patientAvatar,
                      { backgroundColor: cancerInfo.color },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {patient.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientAge}>{calculateAge(patient.dateOfBirth)} años</Text>
                </View>
              </View>

              <View
                style={[styles.ribbonCircle, { backgroundColor: cancerInfo.color }]}
              >
                <CancerRibbon size="sm" color="#FFF" />
              </View>
            </View>

            <View style={styles.infoBlock}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Diagnóstico:</Text>
                <Text style={styles.infoValue}>{cancerInfo.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estadio:</Text>
                <Text style={styles.infoValue}>{patient.stage}</Text>
              </View>
              {myRole && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mi rol:</Text>
                  <View
                    style={[
                      styles.roleTag,
                      {
                        backgroundColor: `${cancerInfo.color}20`,
                        borderColor: cancerInfo.color,
                      },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: cancerInfo.color }]}>
                      {myRole.replace(/_/g, " ").toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Equipo: {patient.careTeam?.length || 0} miembros
              </Text>
              <ChevronRight color="#6B7280" size={18} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// --------------------- ESTILOS ---------------------
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    color: "#4B5563",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: "center",
  },
  errorText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  retryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: "#DC2626",
    fontWeight: "600",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  emptyText: {
    color: "#6B7280",
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  patientCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "white",
    marginBottom: 16,
  },
  patientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  patientImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  patientName: {
    fontWeight: "600",
    color: "#111827",
  },
  patientAge: {
    color: "#6B7280",
    fontSize: 13,
  },
  ribbonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBlock: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  infoLabel: {
    color: "#6B7280",
    fontSize: 13,
  },
  infoValue: {
    color: "#111827",
    fontWeight: "500",
    fontSize: 13,
  },
  roleTag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginTop: 8,
  },
  footerText: {
    color: "#4B5563",
    fontSize: 13,
  },
});
