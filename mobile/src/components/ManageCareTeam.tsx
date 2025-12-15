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
import type { CareTeamMember, Patient, ProfessionalSearchResult } from "../types/medical";
import { Users, UserPlus, UserMinus } from "lucide-react-native";

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

  // 🔍 búsqueda de profesionales
  const [searchValue, setSearchValue] = useState("");
  //const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [searchResults, setSearchResults] = useState<ProfessionalSearchResult[]>([]);


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

  // 🔍 buscar usuarios
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

  // ➕ agregar miembro
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
              setError(err.response?.data?.message || "Error al remover miembro");
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users color="#2563EB" size={22} />
          <Text style={styles.headerTitle}>Equipo de Cuidados</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          <UserPlus color="white" size={18} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Cancelar" : "Agregar"}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {/* Formulario */}
      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.label}>Buscar profesional *</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="RUT o Email"
              value={searchValue}
              onChangeText={setSearchValue}
            />
            <TouchableOpacity onPress={searchUsers} style={styles.searchButton}>
              <Text style={{ color: "white" }}>Buscar</Text>
            </TouchableOpacity>
          </View>

          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={[
                styles.userResult,
                selectedUser?.id === u.id && styles.userSelected,
              ]}
              onPress={() => setSelectedUser(u)}
            >
              <Text style={{ fontWeight: "600" }}>{u.name}</Text>
              <Text style={{ fontSize: 12, color: "#6B7280" }}>{u.email}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.label}>Rol *</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={role} onValueChange={setRole}>
              <Picker.Item label="Selecciona un rol" value="" />
              <Picker.Item label="Oncólogo Principal" value="oncologo_principal" />
              <Picker.Item label="Cirujano" value="cirujano" />
              <Picker.Item label="Radiólogo" value="radiologo" />
              <Picker.Item label="Enfermera Jefe" value="enfermera_jefe" />
              <Picker.Item label="Consultor" value="consultor" />
            </Picker>
          </View>

          <TouchableOpacity
            onPress={handleAddMember}
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>Agregar miembro</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Lista */}
      {careTeam.map((member) => (
        <View key={member.userId} style={styles.memberCard}>
          <View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>{getRoleLabel(member.role)}</Text>
          </View>

          <TouchableOpacity onPress={() => handleRemoveMember(member.userId)}>
            <UserMinus color="#DC2626" size={18} />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flexDirection: "row", gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  addButton: { backgroundColor: "#2563EB", padding: 8, borderRadius: 8, flexDirection: "row", gap: 4 },
  addButtonText: { color: "white" },
  formCard: { backgroundColor: "#EFF6FF", padding: 16, borderRadius: 12 },
  label: { fontWeight: "500", marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 12 },
  primaryButton: { backgroundColor: "#2563EB", padding: 12, borderRadius: 8, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "600" },
  errorText: { color: "#B91C1C" },
  successText: { color: "#16A34A" },
  memberCard: { flexDirection: "row", justifyContent: "space-between", padding: 12, backgroundColor: "white", borderRadius: 8, marginBottom: 8 },
  memberName: { fontWeight: "600" },
  memberRole: { color: "#6B7280" },
  searchButton: { backgroundColor: "#2563EB", padding: 10, borderRadius: 8 },
  userResult: { padding: 8, borderBottomWidth: 1, borderColor: "#E5E7EB" },
  userSelected: { backgroundColor: "#DBEAFE" },
});
