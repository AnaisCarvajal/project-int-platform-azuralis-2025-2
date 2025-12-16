import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Image,} from "react-native";
import { ArrowLeft, Phone, AlertTriangle, Calendar, User,  Pill, Scissors, FileText, StickyNote, Activity as ActivityIcon,} from "lucide-react-native";
import { cancerColors } from "../types/medical";
import type { Patient } from "../types/medical";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ManageCareTeam } from "./ManageCareTeam";
import { calculateAge } from "../common/helpers/CalculateAge";

interface PatientRecordProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientRecord({ patient, onBack }: PatientRecordProps) {
  const cancerColor = cancerColors[patient.cancerType];
  const { user } = useAuth();
  const isStaff = user?.role === "doctor" || user?.role === "nurse";

  const [activeTab, setActiveTab] = useState<"general" | "notes" | "documents" | "team">("general");
  const [notes, setNotes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const patientNotes = await apiService.patients.getNotes(patient.id);
        setNotes(patientNotes);
      } catch (e) {
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    };
    loadNotes();
  }, [patient.id]);

  // Load documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const patientDocuments = await apiService.patients.getDocuments(patient.id);
        setDocuments(patientDocuments);
      } catch (e) {
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, [patient.id]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const callEmergencyContact = (phone: string) => Linking.openURL(`tel:${phone}`);

  const getDocumentBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      examen: "#3b82f6",
      cirugia: "#ef4444",
      quimioterapia: "#8b5cf6",
      radioterapia: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      oncologo_principal: "Oncólogo Principal",
      enfermera_jefe: "Enfermera Jefe",
      cirujano: "Cirujano",
    };
    return roles[role] || role;
  };

  const handleOpenDocument = async (docId: string) => {
    try {
      const { url } = await apiService.documents.getDownloadUrl(docId);
      Linking.openURL(url);
    } catch (e) {
      alert("Error al abrir documento.");
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={18} color="#374151" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.patientHeader}>
          {patient.photo ? (
            <Image source={{ uri: patient.photo }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                { backgroundColor: cancerColor.color + "30" },
              ]}
            >
              <Text style={styles.avatarText}>
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{patient.name}</Text>
            <Text style={styles.meta}>
              {calculateAge(patient.dateOfBirth)} años • RUT: {patient.rut}
            </Text>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: cancerColor.color },
                ]}
              >
                <Text style={styles.badgeText}>{cancerColor.name}</Text>
              </View>
              <View style={styles.badgeOutline}>
                <Text style={styles.badgeOutlineText}>
                  {patient.diagnosis} - {patient.stage}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* ALERGIAS */}
        {patient.allergies.length > 0 && (
          <View style={styles.alertBox}>
            <AlertTriangle color="#DC2626" size={18} />
            <Text style={styles.alertText}>
              ⚠️ ALERGIAS: {patient.allergies.join(", ")}
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabBar}>
          {["general", "notes", "documents", "team"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as any)}
              style={[
                styles.tabBtn,
                activeTab === tab && styles.tabBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === "general"
                  ? "General"
                  : tab === "notes"
                  ? `Notas (${notes.length})`
                  : tab === "documents"
                  ? `Docs (${documents.length})`
                  : "Equipo"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- GENERAL --- */}
        {activeTab === "general" && (
          <View style={styles.section}>
            {/* Medicamentos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Pill color={cancerColor.color} size={18} />
                <Text style={styles.cardTitle}>Medicamentos actuales</Text>
              </View>
              {patient.currentMedications.length > 0 ? (
                patient.currentMedications.map((med, i) => (
                  <Text key={i} style={styles.listItem}>
                    • {med}
                  </Text>
                ))
              ) : (
                <Text style={styles.muted}>Sin medicamentos</Text>
              )}
            </View>

            {/* Contactos */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Phone color="#16A34A" size={18} />
                <Text style={styles.cardTitle}>Contactos de emergencia</Text>
              </View>
              {patient.emergencyContacts.map((c, i) => (
                <View key={i} style={styles.contactRow}>
                  <View>
                    <Text style={styles.bold}>{c.name}</Text>
                    <Text style={styles.small}>{c.relationship}</Text>
                    <Text style={styles.small}>{c.phone}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => callEmergencyContact(c.phone)}
                  >
                    <Phone color="white" size={16} />
                    <Text style={styles.callBtnText}>Llamar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Operaciones */}
            {patient.operations.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Scissors color={cancerColor.color} size={18} />
                  <Text style={styles.cardTitle}>Operaciones relevantes</Text>
                </View>
                {patient.operations.map((op, i) => (
                  <View
                    key={i}
                    style={[
                      styles.opItem,
                      { borderLeftColor: cancerColor.color },
                    ]}
                  >
                    <Text style={styles.bold}>{op.procedure}</Text>
                    <Text style={styles.small}>{formatDate(op.date)}</Text>
                    <Text style={styles.small}>{op.hospital}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tratamiento */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <ActivityIcon color={cancerColor.color} size={18} />
                <Text style={styles.cardTitle}>Tratamiento</Text>
              </View>
              <Text style={styles.body}>{patient.treatmentSummary}</Text>
            </View>
          </View>
        )}

        {/* --- NOTAS --- */}
        {activeTab === "notes" && (
          <View style={styles.section}>
            {loadingNotes ? (
              <ActivityIndicator />
            ) : notes.length === 0 ? (
              <Text style={styles.muted}>Sin notas médicas registradas</Text>
            ) : (
              notes.map((n) => (
                <View key={n.id} style={styles.card}>
                  <Text style={styles.bold}>{n.authorName}</Text>
                  <Text style={styles.small}>{formatDate(n.createdAt)}</Text>
                  <Text style={styles.body}>{n.content}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- DOCUMENTOS --- */}
        {activeTab === "documents" && (
          <View style={styles.section}>
            {loadingDocuments ? (
              <ActivityIndicator />
            ) : documents.length === 0 ? (
              <Text style={styles.muted}>Sin documentos registrados</Text>
            ) : (
              documents.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={styles.card}
                  onPress={() => handleOpenDocument(d.id)}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.bold}>{d.title}</Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: getDocumentBadgeColor(d.type) },
                      ]}
                    >
                      <Text style={styles.badgeText}>{d.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.small}>{formatDate(d.uploadDate)}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* --- EQUIPO --- */}
        {activeTab === "team" && (
          <View style={styles.section}>
            {patient.careTeam.map((m, i) => (
              <View key={i} style={styles.memberRow}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: cancerColor.color },
                  ]}
                >
                  <Text style={styles.memberText}>
                    {m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bold}>{m.name}</Text>
                  <Text style={styles.small}>{getRoleName(m.role)}</Text>
                </View>
                <Text
                  style={[
                    styles.badgeOutlineText,
                    { color: m.status === "active" ? "#16A34A" : "#6B7280" },
                  ]}
                >
                  {m.status === "active" ? "Activo" : "Inactivo"}
                </Text>
              </View>
            ))}

            {isStaff && (
              <ManageCareTeam
                patient={patient}
                onUpdate={() => {}}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "white",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    padding: 16,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: "#374151", fontWeight: "500" },
  patientHeader: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#111827", fontWeight: "700", fontSize: 18 },
  name: { fontSize: 18, fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280", fontSize: 13 },
  badgeRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: "white", fontWeight: "600", fontSize: 12 },
  badgeOutline: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeOutlineText: { fontSize: 12, color: "#374151" },

  content: { padding: 16, gap: 12 },
  alertBox: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertText: { color: "#991B1B", fontSize: 13 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    overflow: "hidden",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#E5E7EB",
  },
  tabBtnActive: { backgroundColor: "#111827" },
  tabText: { color: "#374151", fontWeight: "600", fontSize: 12 },
  tabTextActive: { color: "white" },
  section: { gap: 12, marginTop: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontWeight: "700", fontSize: 15 },
  listItem: { fontSize: 13, color: "#374151" },
  muted: { color: "#6B7280", fontSize: 13 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  callBtnText: { color: "white", fontWeight: "600", fontSize: 12 },
  opItem: {
    borderLeftWidth: 4,
    paddingLeft: 8,
    marginTop: 6,
    backgroundColor: "#F9FAFB",
  },
  body: { color: "#374151", fontSize: 14 },
  small: { color: "#6B7280", fontSize: 12 },
  bold: { color: "#111827", fontWeight: "600", fontSize: 13 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  memberText: { color: "white", fontWeight: "700" },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

});
