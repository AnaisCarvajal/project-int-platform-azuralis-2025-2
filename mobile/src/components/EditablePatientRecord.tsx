import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, Platform, Pressable,
   ScrollView, StyleSheet, Text, TextInput, View,TouchableOpacity,} from "react-native";

   import { Upload, Camera } from "lucide-react-native";
import * as Linking from "expo-linking";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";


import { Patient, EmergencyContact, Operation, DocumentType, getDocumentTypeLabel, } from "../types/medical";
import { cancerColors, DOCTOR_PERMISSIONS, NURSE_PERMISSIONS } from "../types/medical";
import { useAuth } from "../context/AuthContext";
import { apiService } from "../services/api";
import { calculateAge } from "../common/helpers/CalculateAge";


import { CancerRibbon } from "./CancerRibbon";
import { ManageCareTeam } from "./ManageCareTeam";

type TabKey = "general" | "notes" | "documents" | "team";

type NoteItem = any;
type DocumentItem = any;

// En RN no existe File. Usamos un “archivo local” con uri.
type LocalFile = {
  uri: string;
  name: string;
  size?: number;
  type: string;      // mime simplificado (para backend)
  mimeType: string;
};

interface EditablePatientRecordProps {
  patient: Patient;
  onBack: () => void;
}
const TYPE_COLORS: Record<DocumentType, string> = {
  examen: "#2563EB",
  cirugia: "#DC2626",
  quimioterapia: "#7C3AED",
  radioterapia: "#EA580C",
  receta: "#16A34A",
  informe_medico: "#4F46E5",
  consentimiento: "#CA8A04",
  otro: "#4B5563",
};

/* =========================
   UI PRIMITIVES 
   ========================= */

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <View style={styles.cardHeader}>{children}</View>;
}

function CardTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
}

function CardContent({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.cardContent, style]}>{children}</View>;
}

function Badge({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  leftIcon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  style?: any;
}) {
  const vStyle =
    variant === "primary"
      ? styles.comitePrimaryButton
      : variant === "outline"
        ? styles.btnOutline
        : variant === "danger"
          ? styles.btnDanger
          : styles.btnGhost;

  const tStyle =
    variant === "primary" || variant === "danger"
      ? styles.btnTextOnDark
      : styles.btnText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        vStyle,
        disabled ? styles.btnDisabled : null,
        pressed && !disabled ? styles.btnPressed : null,
        style,
      ]}
    >
      <View style={styles.btnInner}>
        {leftIcon ? <View style={styles.btnIcon}>{leftIcon}</View> : null}
        <Text style={tStyle}>{title}</Text>
      </View>
    </Pressable>
  );
}

function TextArea({
  value,
  onChangeText,
  placeholder,
  minHeight = 110,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      multiline
      style={[styles.input, { minHeight, textAlignVertical: "top" }]}
    />
  );
}

/* =========================
   MAIN COMPONENT
   ========================= */

export function EditablePatientRecord({
  patient: initialPatient,
  onBack,
}: EditablePatientRecordProps) {
  const { user } = useAuth();

  const [patient, setPatient] = useState<Patient>(initialPatient);

  const isDoctor = user?.role === "doctor";
  const isNurse = user?.role === "nurse";
  const isStaff = !!user && (isDoctor || isNurse);

  const cancerColor = useMemo(() => cancerColors[patient.cancerType], [patient.cancerType]);

  // Tabs (reemplazo de <Tabs/> web)
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  // Estados de edición por sección
  const [editingMeds, setEditingMeds] = useState(false);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingOperations, setEditingOperations] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<number | null>(null);


  // Temporales
  const [tempMeds, setTempMeds] = useState<string[]>([]);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);
  const [tempContacts, setTempContacts] = useState<EmergencyContact[]>([]);
  const [tempOperations, setTempOperations] = useState<Operation[]>([]);
  const [tempTreatment, setTempTreatment] = useState("");

  // Notas y documentos
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [displayDocuments, setDisplayDocuments] = useState<DocumentItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [saving, setSaving] = useState(false);

  // Foto paciente (placeholder)
  const [patientPhoto, setPatientPhoto] = useState<any>(null);

  // Crear/editar notas
  const [creatingNote, setCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");

  // Subir documentos
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<string>("examen");
  const [selectedFile, setSelectedFile] = useState<LocalFile | null>(null);
  const [newDocDescription, setNewDocDescription] = useState("");
  const [isDocModalVisible, setIsDocModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Comité Oncológico
  const [showComiteTitleModal, setShowComiteTitleModal] = useState(false);
  const [pendingComiteFile, setPendingComiteFile] = useState<LocalFile | null>(null);
  const [pendingComiteTitle, setPendingComiteTitle] = useState("Comité Oncológico");
  const [isLoadingComite, setIsLoadingComite] = useState(false);


  /* =========================
     PERMISSIONS
     ========================= */

  const canEdit = (field: keyof Patient): boolean => {
    if (!isStaff) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.patientProfile?.editableFields.has(field) || false;
  };

  const canCreateNote = () => {
    if (!isStaff) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.notes?.create || false;
  };

  const canEditNote = (note: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    if (!permissions.notes?.update) return false;
    if (permissions.notes.scope === "all") return true;
    return note.authorId === user.id;
  };

  const canDeleteNote = (note: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    if (!permissions.notes?.delete) return false;
    if (permissions.notes.scope === "all") return true;
    return note.authorId === user.id;
  };

  const canUploadDocument = () => {
    if (!isStaff) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.documents?.create || false;
  };

  const canDeleteDocument = (doc: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    if (!permissions.documents?.delete) return false;
    if (permissions.documents.scope === "all") return true;
    return doc.uploaderId === user.id;
  };

  /* =========================
     LOAD NOTES / DOCUMENTS
     ========================= */

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoadingNotes(true);
        const patientNotes = await apiService.patients.getNotes(patient.id);
        setNotes(patientNotes || []);
      } catch (e) {
        console.error("Error loading notes:", e);
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    };
    loadNotes();
  }, [patient.id]);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const patientDocuments = await apiService.patients.getDocuments(patient.id);
        setDocuments(patientDocuments || []);
      } catch (e) {
        console.error("Error loading documents:", e);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };
    loadDocuments();
  }, [patient.id]);

  useEffect(() => {
    const comiteDocs = documents.filter((d: any) => d.isComiteOncologico === true);
    const otherDocs = documents.filter((d: any) => d.isComiteOncologico !== true);
    setDisplayDocuments([...comiteDocs, ...otherDocs]);
  }, [documents]);

  useEffect(() => {
    // placeholder: tu backend aún no tiene foto separada
    setPatientPhoto(null);
  }, [patient.id]);

  /* =========================
     HELPERS
     ========================= */

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const callEmergencyContact = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert("Error", "No se pudo abrir el marcador telefónico.");
    }
  };

  const getDocumentBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      examen: "#3b82f6",
      cirugia: "#ef4444",
      quimioterapia: "#8b5cf6",
      radioterapia: "#f59e0b",
      receta: "#10b981",
      informe_medico: "#7c3aed",
      consentimiento: "#0ea5e9",
      otro: "#6b7280",
    };
    return colors[type] || "#6b7280";
  };

  const getRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      oncologo_principal: "Oncólogo Principal",
      enfermera_jefe: "Enfermera Jefe",
      cirujano: "Cirujano",
    };
    return roleNames[role] || role;
  };

  /* =========================
     SAVE FIELD
     ========================= */

  const saveField = async (field: keyof Patient, value: any) => {
    try {
      setSaving(true);
      const updatedPatient = await apiService.patients.update(patient.id, {
        [field]: value,
      });
      setPatient(updatedPatient);

      Alert.alert("✅ Listo", "Cambios guardados correctamente");
      return true;
    } catch (e) {
      console.error("Error saving field:", e);
      Alert.alert("❌ Error", "Error al guardar. Intenta nuevamente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     EDIT HANDLERS 
     ========================= */

  // Medicamentos
  const startEditingMeds = () => {
    setTempMeds([...(patient.currentMedications || [])]);
    setEditingMeds(true);
  };
  const cancelEditingMeds = () => {
    setTempMeds([]);
    setEditingMeds(false);
  };
  const addMed = () => setTempMeds((prev) => [...prev, ""]);
  const removeMed = (index: number) => setTempMeds((prev) => prev.filter((_, i) => i !== index));
  const updateMed = (index: number, value: string) => {
    setTempMeds((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };
  const saveMeds = async () => {
    const ok = await saveField("currentMedications", tempMeds);
    if (ok) setEditingMeds(false);
  };

  // Alergias
  const startEditingAllergies = () => {
    setTempAllergies([...(patient.allergies || [])]);
    setEditingAllergies(true);
  };
  const cancelEditingAllergies = () => {
    setTempAllergies([]);
    setEditingAllergies(false);
  };
  const addAllergy = () => setTempAllergies((prev) => [...prev, ""]);
  const removeAllergy = (index: number) => setTempAllergies((prev) => prev.filter((_, i) => i !== index));
  const updateAllergy = (index: number, value: string) => {
    setTempAllergies((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };
  const saveAllergies = async () => {
    const ok = await saveField("allergies", tempAllergies);
    if (ok) setEditingAllergies(false);
  };

  // Contactos
  const startEditingContacts = () => {
    setTempContacts([...(patient.emergencyContacts || [])]);
    setEditingContacts(true);
  };
  const cancelEditingContacts = () => {
    setTempContacts([]);
    setEditingContacts(false);
  };
  const addContact = () => setTempContacts((prev) => [...prev, { name: "", relationship: "", phone: "" }]);
  const removeContact = (index: number) => setTempContacts((prev) => prev.filter((_, i) => i !== index));
  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setTempContacts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };
  const saveContacts = async () => {
    const ok = await saveField("emergencyContacts", tempContacts);
    if (ok) setEditingContacts(false);
  };

  // Operaciones
  const startEditingOperations = () => {
    setTempOperations([...(patient.operations || [])]);
    setEditingOperations(true);
  };
  const cancelEditingOperations = () => {
    setTempOperations([]);
    setEditingOperations(false);
  };
  const addOperation = () => setTempOperations((prev) => [...prev, { date: "", procedure: "", hospital: "" }]);
  const removeOperation = (index: number) => setTempOperations((prev) => prev.filter((_, i) => i !== index));
  const updateOperation = (index: number, field: keyof Operation, value: string) => {
    setTempOperations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };
  const saveOperations = async () => {
    const ok = await saveField("operations", tempOperations);
    if (ok) setEditingOperations(false);
  };

  // Tratamiento
  const startEditingTreatment = () => {
    setTempTreatment(patient.treatmentSummary || "");
    setEditingTreatment(true);
  };
  const cancelEditingTreatment = () => {
    setTempTreatment("");
    setEditingTreatment(false);
  };
  const saveTreatment = async () => {
    const ok = await saveField("treatmentSummary", tempTreatment);
    if (ok) setEditingTreatment(false);
  };

  /* =========================
     NOTES (lógica igual a web)
     ========================= */

  const createNote = async () => {
    if (!newNoteContent.trim() || !user) {
      Alert.alert("Falta contenido", "Por favor escribe el contenido de la nota");
      return;
    }

    try {
      setSaving(true);
      const newNote = await apiService.notes.create({
        patientId: patient.id,
        authorId: user.id,
        authorName: user.name,
        content: newNoteContent,
        title: `Nota de ${user.name}`,
        date: new Date().toISOString(),
      });

      setNotes((prev) => [newNote, ...prev]);
      setNewNoteContent("");
      setCreatingNote(false);
      Alert.alert("✅ Listo", "Nota creada exitosamente");
    } catch (e) {
      console.error("Error creating note:", e);
      Alert.alert("❌ Error", "Error al crear la nota");
    } finally {
      setSaving(false);
    }
  };

  const startEditingNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  const saveEditedNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) {
      Alert.alert("Contenido vacío", "El contenido de la nota no puede estar vacío");
      return;
    }

    try {
      setSaving(true);
      await apiService.notes.update(noteId, { content: editingNoteContent });
      setNotes((prev) => prev.map((n: any) => (n.id === noteId ? { ...n, content: editingNoteContent } : n)));
      setEditingNoteId(null);
      setEditingNoteContent("");
      Alert.alert("✅ Listo", "Nota actualizada exitosamente");
    } catch (e) {
      console.error("Error updating note:", e);
      Alert.alert("❌ Error", "Error al actualizar la nota");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    Alert.alert("Eliminar nota", "¿Estás seguro de eliminar esta nota?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);
            await apiService.notes.delete(noteId);
            setNotes((prev) => prev.filter((n: any) => n.id !== noteId));
            Alert.alert("✅ Listo", "Nota eliminada exitosamente");
          } catch (e) {
            console.error("Error deleting note:", e);
            Alert.alert("❌ Error", "Error al eliminar la nota");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  /* =========================
     DOCUMENT PICKERS (Expo)
     ========================= */

  const validatePickedFile = (file: LocalFile) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size && file.size > maxSize) {
      Alert.alert("Archivo muy grande", "El tamaño máximo es 10MB.");
      return false;
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "application/pdf", "image/webp"];
    if (!allowed.includes(file.mimeType)) {
      Alert.alert("Tipo no permitido", "Solo imágenes (JPG, PNG, GIF, WEBP) y PDF.");
      return false;
    }

    return true;
  };

  const pickFileForGeneralUpload = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const file: LocalFile = {
      uri: asset.uri,
      name: asset.name ?? "documento",
      type: asset.mimeType ?? "application/octet-stream",
      mimeType: asset.mimeType ?? "application/octet-stream",
      size: asset.size,
    };

    if (!validatePickedFile(file)) return;

    setSelectedFile(file);
    if (!newDocTitle.trim()) {
      const base = (file.name || "documento").split(".").slice(0, -1).join(".") || "documento";
      setNewDocTitle(base);
    }
  };

  const pickFileForComite = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const file: LocalFile = {
      uri: asset.uri,
      name: asset.name ?? "documento",
      type: asset.mimeType ?? "application/octet-stream",
      mimeType: asset.mimeType ?? "application/octet-stream",
      size: asset.size,
    };

    if (!validatePickedFile(file)) return;

    setPendingComiteFile(file);
    setPendingComiteTitle("Comité Oncológico");
    setShowComiteTitleModal(true);
  };

  const takeComitePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos permiso de cámara para tomar la foto.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (res.canceled) return;
    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const file: LocalFile = {
      uri: asset.uri,
      name: asset.fileName ?? "foto.jpg",
      type: "image/jpeg",
      mimeType: "image/jpeg",
    };

    setPendingComiteFile(file);
    setPendingComiteTitle("Comité Oncológico");
    setShowComiteTitleModal(true);
  };

  /* =========================
     DOCUMENT ACTIONS (API)
     ========================= */

  // SUBIR DOC “general”
  const uploadDocument = async () => {
    if (!newDocTitle.trim() || !selectedFile) {
      Alert.alert("Faltan datos", "Completa el título y selecciona un archivo.");
      return;
    }
    if (!user) return;

    try {
      setSaving(true);
      const newDoc = await apiService.documents.create(
        {
          patientId: patient.id,
          uploaderId: user.id,
          title: newDocTitle,
          type: newDocType as any,
          description: newDocDescription,
          uploadDate: new Date().toISOString(),
        },
        selectedFile // LocalFile
      );

      setDocuments((prev) => [newDoc, ...prev]);
      setNewDocTitle("");
      setSelectedFile(null);
      setNewDocDescription("");
      setUploadingDoc(false);

      Alert.alert("✅ Listo", "Documento subido exitosamente");
    } catch (e) {
      console.error("Error uploading document:", e);
      Alert.alert("❌ Error", "Error al subir el documento");
    } finally {
      setSaving(false);
    }
  };

  // CONFIRMAR COMITÉ
  const confirmUploadComite = async () => {
    if (!pendingComiteFile || !pendingComiteTitle.trim()) {
      Alert.alert("Falta título", "Ingresa un título para el documento.");
      return;
    }
    if (!user) {
      Alert.alert("Error", "Faltan datos de usuario.");
      return;
    }

    setIsLoadingComite(true);
    try {
      const newDoc = await apiService.documents.create(
        {
          title: pendingComiteTitle.trim(),
          type: "informe_medico",
          patientId: patient.id,
          uploaderId: user.id,
          uploadDate: new Date().toISOString(),
          isComiteOncologico: true,
        },
        pendingComiteFile // LocalFile
      );

      setDocuments((prev) => [newDoc, ...prev]);
      setPendingComiteFile(null);
      setPendingComiteTitle("Comité Oncológico");
      setShowComiteTitleModal(false);

      Alert.alert("✅ Listo", "Documento del Comité Oncológico subido exitosamente.");
    } catch (e) {
      console.error("Error uploading comite doc:", e);
      Alert.alert("❌ Error", "Error al subir el documento. Intenta de nuevo.");
    } finally {
      setIsLoadingComite(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    Alert.alert("Eliminar documento", "¿Estás seguro de eliminar este documento?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);
            await apiService.documents.delete(docId);
            setDocuments((prev) => prev.filter((d: any) => d.id !== docId));
            Alert.alert("✅ Listo", "Documento eliminado exitosamente");
          } catch (e) {
            console.error("Error deleting document:", e);
            Alert.alert("❌ Error", "Error al eliminar el documento");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const openDocument = async (docId: string) => {
    try {
      const { url } = await apiService.documents.getDownloadUrl(docId);
      await Linking.openURL(url);
    } catch (e) {
      console.error("Error opening document:", e);
      Alert.alert("❌ Error", "No se pudo abrir el documento.");
    }
  };

  /* =========================
     RENDER 
     ========================= */
  const softCancerBg = `${cancerColor.color}10`;

const handleTakePhoto = async () => {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== "granted") {
    Alert.alert("Permiso requerido", "Necesitamos acceso a la cámara.");
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.9,
  });

  if (result.canceled) return;

  const asset = result.assets?.[0];
  if (!asset?.uri) return;

  setSelectedFile({
  uri: asset.uri,
  name: asset.fileName ?? "foto.jpg",
  type: "image/jpeg",
  mimeType: "image/jpeg",
});
};


  return (
    <View style={styles.screen}>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <Button
            title="Volver"
            variant="ghost"
            onPress={onBack}
            leftIcon={<Ionicons name="arrow-back" size={18} color="#111827" />}
            style={{ paddingHorizontal: 10 }}
          />
          <View style={styles.headerCenter}>
            <CancerRibbon size="lg" style={{ color: "#ff6299" }} />
            <Text style={styles.headerBrand}>UCN</Text>
          </View>
        </View>

        <View style={styles.patientHeader}>
          <View style={[styles.avatar, { backgroundColor: cancerColor.color + "33" }]}>
            <Text style={styles.avatarText}>
              {patient.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {calculateAge(patient.dateOfBirth)} años · RUT: {patient.rut}
            </Text>

            <View style={styles.badgesRow}>
              <Badge style={{ backgroundColor: cancerColor.color }}>
                {cancerColor.name}
              </Badge>
              <Badge style={styles.badgeOutline}>
                {patient.diagnosis} - Etapa {patient.stage}
              </Badge>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TabButton label={`General`} active={activeTab === "general"} onPress={() => setActiveTab("general")} />
          <TabButton label={`Notas (${notes.length})`} active={activeTab === "notes"} onPress={() => setActiveTab("notes")} />
          <TabButton label={`Docs (${documents.length})`} active={activeTab === "documents"} onPress={() => setActiveTab("documents")} />
          <TabButton label={`Equipo`} active={activeTab === "team"} onPress={() => setActiveTab("team")} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {activeTab === "general" && (
  <>
    {/* ================= MEDICAMENTOS ================= */}
    <Card>
      <CardHeader>
        <CardTitle>Medicamentos Actuales</CardTitle>
      </CardHeader>
      <CardContent>
        {editingMeds ? (
          <>
            {tempMeds.map((med, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  value={med}
                  onChangeText={(v) => updateMed(i, v)}
                  placeholder="Nombre del medicamento"
                  style={[styles.input, { flex: 1 }]}
                />
                <Button
                  title="✕"
                  variant="danger"
                  onPress={() => removeMed(i)}
                />
              </View>
            ))}

            <Button title="Agregar medicamento" variant="outline" onPress={addMed} />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button title="Guardar" onPress={saveMeds} style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={cancelEditingMeds}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : patient.currentMedications?.length ? (
          <>
            {patient.currentMedications.map((m, i) => (
              <Text key={i} style={{ marginBottom: 4 }}>
                • {m}
              </Text>
            ))}
            {canEdit("currentMedications") && (
              <Button title="Editar" variant="ghost" onPress={startEditingMeds} />
            )}
          </>
        ) : (
          <>
            <Text style={{ color: "#6B7280" }}>Sin medicamentos registrados</Text>
            {canEdit("currentMedications") && (
              <Button title="Agregar" variant="ghost" onPress={startEditingMeds} />
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* ================= CONTACTOS ================= */}
    <Card>
      <CardHeader>
        <CardTitle>Contactos de Emergencia</CardTitle>
      </CardHeader>
      <CardContent>
        {editingContacts ? (
          <>
            {tempContacts.map((c, i) => (
              <View key={i} style={{ gap: 8, marginBottom: 8 }}>
                <TextInput
                  placeholder="Nombre"
                  value={c.name}
                  onChangeText={(v) => updateContact(i, "name", v)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Relación"
                  value={c.relationship}
                  onChangeText={(v) => updateContact(i, "relationship", v)}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Teléfono"
                  value={c.phone}
                  onChangeText={(v) => updateContact(i, "phone", v)}
                  keyboardType="phone-pad"
                  inputMode="tel"
                  style={styles.input}
                />

                <Button
                  title="Eliminar contacto"
                  variant="danger"
                  onPress={() => removeContact(i)}
                />
              </View>
            ))}

            <Button title="Agregar contacto" variant="outline" onPress={addContact} />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button title="Guardar" onPress={saveContacts} style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={cancelEditingContacts}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <>
            {patient.emergencyContacts.map((c, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View>
                  <Text style={{ fontWeight: "700" }}>{c.name}</Text>
                  <Text>{c.relationship}</Text>
                  <Text>{c.phone}</Text>
                </View>
                <Button title="Llamar"
                  onPress={() => callEmergencyContact(c.phone)}
                  style={styles.callButton}
                />
              </View>
            ))}

            {canEdit("emergencyContacts") && (
              <Button title="Editar" variant="ghost" onPress={startEditingContacts} />
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* ================= ALERGIAS ================= */}
    <Card style={patient.allergies?.length ? styles.allergyCard : undefined}>
      <CardHeader>
        <CardTitle>Alergias</CardTitle>
      </CardHeader>
      <CardContent>
        {editingAllergies ? (
          <>
            {tempAllergies.map((a, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  value={a}
                  onChangeText={(v) => updateAllergy(i, v)}
                  placeholder="Alergia"
                  style={[styles.input, { flex: 1 }]}
                />
                <Button title="✕" variant="danger" onPress={() => removeAllergy(i)} />
              </View>
            ))}

            <Button title="Agregar alergia" variant="outline" onPress={addAllergy} />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button title="Guardar" onPress={saveAllergies} style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={cancelEditingAllergies}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : patient.allergies?.length ? (
          <>
            {patient.allergies.map((a, i) => (
              <Text key={i} style={styles.allergyItem}>⚠️ {a}</Text>
            ))}
            {canEdit("allergies") && (
              <Button title="Editar" variant="ghost" onPress={startEditingAllergies} />
            )}
          </>
        ) : (
          <>
            <Text style={{ color: "#6B7280" }}>Sin alergias registradas</Text>
            {canEdit("allergies") && (
              <Button title="Agregar" variant="ghost" onPress={startEditingAllergies} />
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* ================= OPERACIONES ================= */}
    <Card>
      <CardHeader>
        <CardTitle>Intervenciones Quirúrgicas</CardTitle>
      </CardHeader>
      <CardContent>
        {editingOperations ? (
          <>
            {tempOperations.map((op, i) => (
              <View key={i} style={{ gap: 8, marginBottom: 8 }}>
                <TextInput
                  placeholder="Procedimiento"
                  value={op.procedure}
                  onChangeText={(v) => updateOperation(i, "procedure", v)}
                  style={styles.input}
                />
                <Pressable onPress={() => setShowDatePicker(i)}>
                <TextInput
                  placeholder="Fecha"
                  value={op.date}
                  editable={false}
                  style={styles.input}
                />
              </Pressable>

              {showDatePicker === i && (
                <DateTimePicker
                  value={op.date ? new Date(op.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(null);
                    if (selectedDate) {
                      updateOperation(i, "date", selectedDate.toISOString());
                    }
                  }}
                />
              )}
                <TextInput
                  placeholder="Hospital"
                  value={op.hospital}
                  onChangeText={(v) => updateOperation(i, "hospital", v)}
                  style={styles.input}
                />
                <Button title="Eliminar" variant="danger" onPress={() => removeOperation(i)} />
              </View>
            ))}

            <Button title="Agregar operación" variant="outline" onPress={addOperation} />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button title="Guardar" onPress={saveOperations} style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={cancelEditingOperations}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : patient.operations?.length ? (
          <>
            {patient.operations.map((op, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: "700" }}>{op.procedure}</Text>
                <Text>{formatDate(op.date)}</Text>
                <Text>{op.hospital}</Text>
              </View>
            ))}
            {canEdit("operations") && (
              <Button title="Editar" variant="ghost" onPress={startEditingOperations} />
            )}
          </>
        ) : (
          <>
            <Text style={{ color: "#6B7280" }}>Sin operaciones registradas</Text>
            {canEdit("operations") && (
              <Button title="Agregar" variant="ghost" onPress={startEditingOperations} />
            )}
          </>
        )}
      </CardContent>
    </Card>

    {/* ================= TRATAMIENTO ================= */}
    <Card>
      <CardHeader>
        <CardTitle>Estado del Tratamiento</CardTitle>
      </CardHeader>
      <CardContent>
        {editingTreatment ? (
          <>
            <TextArea
              value={tempTreatment}
              onChangeText={setTempTreatment}
              placeholder="Resumen del tratamiento"
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button title="Guardar" onPress={saveTreatment} style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                variant="outline"
                onPress={cancelEditingTreatment}
                style={{ flex: 1 }}
              />
            </View>
          </>
        ) : (
          <>
            <Text>{patient.treatmentSummary}</Text>
            {canEdit("treatmentSummary") && (
              <Button title="Editar" variant="ghost" onPress={startEditingTreatment} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  </>
)}

        {activeTab === "notes" && (
  <>
    {/* ===== CREAR NUEVA NOTA ===== */}
    {canCreateNote() && (
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Nota Médica</CardTitle>
        </CardHeader>
        <CardContent>
          {creatingNote ? (
            <>
              <TextArea
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                placeholder="Escribe aquí la nota médica..."
                minHeight={140}
              />

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <Button
                  title={saving ? "Guardando..." : "Guardar Nota"}
                  onPress={createNote}
                  disabled={saving}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancelar"
                  variant="outline"
                  onPress={() => {
                    setCreatingNote(false);
                    setNewNoteContent("");
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <Button
              title="Nueva Nota"
              onPress={() => setCreatingNote(true)}
            />
          )}
        </CardContent>
      </Card>
    )}

    {/* ===== LISTA DE NOTAS ===== */}
    {loadingNotes ? (
      <Card>
        <CardContent>
          <ActivityIndicator />
          <Text style={{ textAlign: "center", marginTop: 8, color: "#6B7280" }}>
            Cargando notas...
          </Text>
        </CardContent>
      </Card>
    ) : notes.length === 0 ? (
      <Card>
        <CardContent>
          <Text style={{ textAlign: "center", color: "#6B7280" }}>
            No hay notas médicas registradas
          </Text>
        </CardContent>
      </Card>
    ) : (
      notes.map((note) => {
        const editable = canEditNote(note);
        const deletable = canDeleteNote(note);

        return (
          <Card key={note.id}>
            <CardHeader>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontWeight: "700" }}>{note.authorName}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>
                    {formatDate(note.createdAt || note.date)}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {editable && editingNoteId !== note.id && (
                    <Button
                      title="Editar"
                      variant="ghost"
                      onPress={() => startEditingNote(note)}
                    />
                  )}
                  {deletable && (
                    <Button
                      title="Eliminar"
                      variant="danger"
                      onPress={() => deleteNote(note.id)}
                    />
                  )}
                </View>
              </View>
            </CardHeader>

            <CardContent>
              {editingNoteId === note.id ? (
                <>
                  <TextArea
                    value={editingNoteContent}
                    onChangeText={setEditingNoteContent}
                    minHeight={140}
                  />

                  <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <Button
                      title="Guardar Cambios"
                      onPress={() => saveEditedNote(note.id)}
                      disabled={saving}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title="Cancelar"
                      variant="outline"
                      onPress={cancelEditingNote}
                      style={{ flex: 1 }}
                    />
                  </View>
                </>
              ) : (
                <Text style={{ color: "#374151", lineHeight: 20 }}>
                  {note.content}
                </Text>
              )}
            </CardContent>
          </Card>
        );
      })
    )}
  </>
)}

     {activeTab === "documents" && (
  <>
    {/* ===== SUBIR DOCUMENTO GENERAL ===== */}
    {canUploadDocument() && (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nuevo Documento</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          title="Subir Documento"
          onPress={() => setIsDocModalVisible(true)}
        />
      </CardContent>
    </Card>
  )}

    {/* ===== COMITÉ ONCOLÓGICO ===== */}
    {canUploadDocument() && (
  <Card style={styles.comiteCard}>
    <CardHeader>
      <CardTitle style={styles.comiteTitle}>
        Comité Oncológico
      </CardTitle>
    </CardHeader>

    <CardContent>
      <Button
        title="Subir Archivo"
        onPress={pickFileForComite}
        style={[styles.comitePrimaryButton, { marginBottom: 10 }]}
      />

      <Button
        title="Tomar Foto"
        variant="outline"
        onPress={takeComitePhoto}
        style={styles.comiteOutlineButton}
      />

      {documents.filter(d => d.isComiteOncologico).length === 0 ? (
        <Text style={styles.comiteEmpty}>
          Sin documentos del comité aún
        </Text>
      ) : (
        documents
          .filter(d => d.isComiteOncologico)
          .map(doc => (
            <Card key={doc.id} style={{ marginTop: 12 }}>
              <CardContent>
                <Text style={styles.comiteDocTitle}>
                  {doc.title}
                </Text>

                <Text style={styles.comiteDocDate}>
                  {formatDate(doc.uploadDate)}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <Button
                    title="Abrir"
                    onPress={() => openDocument(doc.id)}
                    style={[styles.comitePrimaryButton, { flex: 1 }]}
                  />

                  {canDeleteDocument(doc) && (
                    <Button
                      title="Eliminar"
                      variant="danger"
                      onPress={() => deleteDocument(doc.id)}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </CardContent>
            </Card>
          ))
      )}
    </CardContent>
  </Card>
)}

    {/* ===== OTROS DOCUMENTOS ===== */}
    <Card>
      <CardHeader>
        <CardTitle>Otros Documentos</CardTitle>
      </CardHeader>
      <CardContent>
        {loadingDocuments ? (
          <ActivityIndicator />
        ) : displayDocuments.filter(d => !d.isComiteOncologico).length === 0 ? (
          <Text style={{ color: "#6B7280" }}>
            No hay otros documentos registrados
          </Text>
        ) : (
          displayDocuments
            .filter(d => !d.isComiteOncologico)
            .map(doc => (
              <View key={doc.id} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: "700" }}>{doc.title}</Text>
                <Text style={{ color: "#6B7280" }}>
                  {formatDate(doc.uploadDate)}
                </Text>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                  <Button
                    title="Abrir"
                    variant="outline"
                    onPress={() => openDocument(doc.id)}
                    style={{ flex: 1 }}
                  />
                  {canDeleteDocument(doc) && (
                    <Button
                      title="Eliminar"
                      variant="danger"
                      onPress={() => deleteDocument(doc.id)}
                      style={{ flex: 1 }}
                    />
                  )}
                </View>
              </View>
            ))
        )}
      </CardContent>
    </Card>
  </>
)}

{/* ===== TAB EQUIPO ===== */}
{activeTab === "team" && (
  <Card>
    <CardHeader>
      <CardTitle>Equipo de Cuidados</CardTitle>
    </CardHeader>
    <CardContent>
      {patient.careTeam.map((m, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 10,
            gap: 10,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: cancerColor.color,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {m.name
                .split(" ")
                .map(n => n[0])
                .join("")
                .slice(0, 2)}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700" }}>{m.name}</Text>
            <Text style={{ color: "#6B7280" }}>{getRoleName(m.role)}</Text>
          </View>

          <Badge>
            {m.status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        </View>
      ))}

      {isStaff && (
        <ManageCareTeam
          patient={patient}
          onUpdate={() => {}}
        />
      )}
    </CardContent>
  </Card>
)}
      </ScrollView>
      <Modal
        visible={showComiteTitleModal}
        animationType="fade"
        transparent
        onRequestClose={() => !isLoadingComite && setShowComiteTitleModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Título del documento</Text>
            <Text style={styles.modalDesc}>
              Ingresa un nombre para identificar este documento del Comité Oncológico
            </Text>

            <TextInput
              value={pendingComiteTitle}
              onChangeText={setPendingComiteTitle}
              editable={!isLoadingComite}
              placeholder="Ej: Informe Comité Oncológico 12/10"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <Button
                title="Cancelar"
                variant="outline"
                disabled={isLoadingComite}
                onPress={() => {
                  setShowComiteTitleModal(false);
                  setPendingComiteFile(null);
                  setPendingComiteTitle("Comité Oncológico");
                }}
                style={{ flex: 1 }}
              />
              <Button
                title={isLoadingComite ? "Subiendo..." : "Guardar"}
                disabled={isLoadingComite || !pendingComiteTitle.trim()}
                onPress={confirmUploadComite}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* MODAL DOC TRADICIONALES */}
      <Modal
      visible={isDocModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => !isLoading && setIsDocModalVisible(false)}>
    
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Nuevo Documento</Text>

          <Text style={styles.label}>Título</Text>
          <TextInput
            placeholder="Ej: Receta Tamoxifeno"
            style={styles.input}
            value={newDocTitle}
            onChangeText={setNewDocTitle}
          />

          <Text style={styles.label}>Tipo de documento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(
              [
                "examen",
                "cirugia",
                "quimioterapia",
                "radioterapia",
                "receta",
                "informe_medico",
                "consentimiento",
                "otro",
              ] as DocumentType[]
            ).map((type) => {
              const active = newDocType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewDocType(type)}
                  style={[
                    styles.typeChip,
                    active && {
                      backgroundColor: TYPE_COLORS[type],
                      borderColor: TYPE_COLORS[type],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      active && { color: "#fff", fontWeight: "700" },
                    ]}
                  >
                    {getDocumentTypeLabel(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.uploadRow}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickFileForGeneralUpload}>
              <Upload size={16} color="#2563EB" />
              <Text style={styles.uploadText}>
                {selectedFile ? selectedFile.name : "Subir archivo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: cancerColor.color }]}
            onPress={handleTakePhoto}
          >
            <Camera size={16} color="#2563EB" />
            <Text style={styles.primaryBtnText}>Tomar foto</Text>
          </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => setIsDocModalVisible(false)}
            >
              <Text style={styles.outlineText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.comitePrimaryButton, { backgroundColor: cancerColor.color }]}
              onPress={uploadDocument}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.comitePrimaryButton}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </View>
  );
}

/* =========================
   TAB BUTTON
   ========================= */

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabBtn, active ? styles.tabBtnActive : null]}>
      <Text style={[styles.tabText, active ? styles.tabTextActive : null]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/* =========================
   STYLES
   ========================= */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },

  stickyHeader: {
    paddingTop: Platform.OS === "ios" ? 54 : 18,
    paddingBottom: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBrand: { fontWeight: "700", color: "#111827" },

  patientHeader: { flexDirection: "row", gap: 12, marginTop: 10, alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: "#111827", fontSize: 18 },

  patientName: { fontSize: 20, fontWeight: "700", color: "#111827" },
  patientMeta: { marginTop: 3, color: "#6B7280" },

  badgesRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },

  tabsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: { backgroundColor: "#111827" },
  tabText: { fontSize: 12, color: "#111827", fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF" },

  body: { padding: 14, paddingBottom: 140, gap: 12 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  cardHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardContent: { paddingHorizontal: 14, paddingBottom: 14 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  badgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  badgeOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },

  btnBase: {
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  btnIcon: { marginRight: 8 },

  btnDanger: { backgroundColor: "#DC2626" },
  btnOutline: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB" },
  btnGhost: { backgroundColor: "transparent" },

  btnTextOnDark: { color: "#FFFFFF", fontWeight: "700" },
  btnText: { color: "#111827", fontWeight: "700" },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.85 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  modalDesc: { color: "#6B7280", marginTop: 6, marginBottom: 12 },
  
  allergyCard: {
  borderColor: "#FCA5A5",
  backgroundColor: "#FEF2F2",
},

allergyItem: {
  backgroundColor: "#FEE2E2",
  padding: 8,
  borderRadius: 8,
  marginTop: 6,
},

  callButton: {
  backgroundColor: "#16A34A", // verde
},

comiteCard: {
  borderColor: "#C4B5FD",
  backgroundColor: "#F5F3FF",
},

comiteTitle: {
  color: "#6D28D9",
},

comitePrimaryButton: {
  backgroundColor: "#7C3AED",
},

comiteOutlineButton: {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: "#7C3AED",
},

comiteEmpty: {
  textAlign: "center",
  color: "#6B7280",
  marginTop: 14,
},

comiteDocTitle: {
  marginTop:5,
  fontWeight: "700",
  color: "#111827",
},

comiteDocDate: {
  color: "#6D28D9",
  marginTop: 1,
},
// Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", borderRadius: 12, padding: 16, width: "100%" },
  label: { fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 6 },
  uploadRow: { flexDirection: "row", justifyContent: "space-between", gap: 10, marginTop: 10, marginBottom: 10 },
  uploadBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  uploadText: { marginLeft: 8, color: "#2563EB", fontWeight: "500" },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  outlineBtn: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 },
  outlineText: { color: "#111827", fontWeight: "600" },

    actionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  actionBtnRed: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  typeChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  typeChipText: {
    color: "#374151",
    fontWeight: "500",
    fontSize: 13,
  },

  newDocBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 12,
  paddingVertical: 10,
  borderRadius: 10,
},
newDocText: {
  color: "#fff",
  fontWeight: "600",
  marginLeft: 6,
  fontSize: 15,
  },

primaryBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2563EB", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
primaryBtnText: { marginLeft: 8, color: "#2563EB", fontWeight: "500" },

});
