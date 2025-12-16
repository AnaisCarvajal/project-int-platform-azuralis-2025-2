import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { apiService } from "../services/api";
import type {
  CareTeamMember,
  Patient,
  ProfessionalSearchResult,
} from "../types/medical";
import { Users, UserPlus, UserMinus, Search, X } from "lucide-react-native";

interface ManageCareTeamProps {
  patient: Patient;
  onUpdate: () => void;
}

export function ManageCareTeam({ patient, onUpdate }: ManageCareTeamProps) {
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // 🔍 búsqueda
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] =
    useState<ProfessionalSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    loadCareTeam();
  }, [patient.id]);

  const loadCareTeam = async () => {
    try {
      const team = await apiService.careTeam.getByPatient(patient.id);
      setCareTeam(team.filter((m: CareTeamMember) => m.status === "active"));
    } catch (err) {
      console.error("Error al cargar equipo:", err);
    }
  };

  const searchUsers = async () => {
    if (!searchValue.trim()) return;

    setLoading(true);
    setError("");
    try {
      const results = await apiService.users.search(searchValue);
      setSearchResults(results);
    } catch {
      setError("No se encontraron profesionales");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    setError("");
    setSuccess("");

    if (!selectedUser || !role) {
      setError("Debes seleccionar un profesional y un rol");
      return;
    }

    setLoading(true);
    try {
      await apiService.careTeam.addToPatient(
        patient.id,
        selectedUser.id,
        selectedUser.name,
        role
      );

      setSuccess("Miembro agregado exitosamente");
      setSelectedUser(null);
      setSearchValue("");
      setSearchResults([]);
      setRole("");
      setShowAddForm(false);

      await loadCareTeam();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al agregar miembro");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (userId: string) => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de remover este miembro del equipo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiService.careTeam.removeFromPatient(patient.id, userId);
              await loadCareTeam();
              onUpdate();
            } catch (err: any) {
              setError(
                err.response?.data?.message || "Error al remover miembro"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      oncologo_principal: "Oncólogo Principal",
      cirujano: "Cirujano",
      radiologo: "Radiólogo",
      enfermera_jefe: "Enfermera Jefe",
      consultor: "Consultor",
    };
    return labels[role] || role;
  };

  const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  };


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.teamCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Users color="#2563EB" size={22} />
            <Text style={styles.headerTitle}>Equipo de Cuidados</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.iconButton}
          >
            {showAddForm ? (
              <X color="#374151" size={22} />
            ) : (
              <UserPlus color="#2563EB" size={22} />
            )}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        {/* Formulario */}
        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.label}>Buscar profesional *</Text>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="RUT, Nombre o Email"
                value={searchValue}
                onChangeText={setSearchValue}
              />
              <TouchableOpacity
                onPress={searchUsers}
                style={styles.searchIconButton}
              >
                <Search color="white" size={18} />
              </TouchableOpacity>
            </View>

            {searchResults.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[
                  styles.userResultCard,
                  selectedUser?.id === u.id && styles.userSelected,
                ]}
                onPress={() => setSelectedUser(u)}
              >
                <Text style={styles.userName}>{u.name}</Text>
                <Text style={styles.userMeta}>{u.email}</Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.label}>Rol *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={role} onValueChange={setRole}>
                <Picker.Item label="Selecciona un rol" value="" />
                <Picker.Item
                  label="Oncólogo Principal"
                  value="oncologo_principal"
                />
                <Picker.Item label="Cirujano" value="cirujano" />
                <Picker.Item label="Radiólogo" value="radiologo" />
                <Picker.Item
                  label="Enfermera Jefe"
                  value="enfermera_jefe"
                />
                <Picker.Item label="Consultor" value="consultor" />
              </Picker>
            </View>

            <TouchableOpacity
              onPress={handleAddMember}
              disabled={loading}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryButtonText}>Agregar miembro</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Lista */}
        {careTeam.map((member) => (
          <View key={member.userId} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>
                {getRoleLabel(member.role)}
              </Text>

              {member.assignedAt && (
                <Text style={styles.memberDate}>
                  Asignado: {formatDate(member.assignedAt)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleRemoveMember(member.userId)}
            >
              <UserMinus color="#DC2626" size={18} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  teamCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerLeft: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  addButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  addButtonText: {
    color: "white",
    fontWeight: "600",
  },

  formCard: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },

  label: {
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },

  searchIconButton: {
    backgroundColor: "#2563EB",
    padding: 10,
    borderRadius: 10,
  },

  userResultCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  userSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#2563EB",
  },

  userName: {
    fontWeight: "600",
    fontSize: 14,
  },

  userMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },

  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: "#D1D5DB",
    backgroundColor: "white",
  },

  primaryButton: {
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "white",
    fontWeight: "600",
  },

  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 10,
  },

  memberInfo: {
    flex: 1,
  },

  memberName: {
    fontWeight: "600",
  },

  memberRole: {
    color: "#6B7280",
  },

  memberDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },

  errorText: {
    color: "#B91C1C",
    marginBottom: 8,
  },

  successText: {
    color: "#16A34A",
    marginBottom: 8,
  },
  
  iconButton: {
  padding: 6,
  borderRadius: 999,
  },
});
