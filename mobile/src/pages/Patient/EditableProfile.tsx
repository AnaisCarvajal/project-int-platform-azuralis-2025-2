// EditableProfile.mobile.tsx
import React, { useEffect, useRef, useState } from "react";
import { View,Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, ActivityIndicator, Alert, Linking, Platform, Pressable} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useAuth } from "../../context/AuthContext";
import { usePatientData } from "../../hooks/usePatientData";
import { apiService } from "../../services/api";
import { cancerColors, PATIENT_PERMISSIONS } from "../../types/medical";
import type { Patient, EmergencyContact, Operation, CancerType } from "../../types/medical";
import { calculateAge } from "../../common/helpers/CalculateAge";
import { optimizeProfilePicture, getReadableFileSize } from "../../common/helpers/ImageOptimizer";

import { User, Palette, Lock, LogOut, Edit3, Save, AlertCircle, Phone, Pill, Scissors, Plus, Trash2,X,} from "lucide-react-native";

export function EditableProfile() {
  const { user, logout } = useAuth();
  const { patientId } = usePatientData();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [userPhoto, setUserPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Imagen seleccionada (preview local si la necesitas)
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const fileInputRef = useRef<any>(null);

  // Estados de edición
  const [editingName, setEditingName] = useState(false);
  const [editingMeds, setEditingMeds] = useState(false);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingOperations, setEditingOperations] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<number | null>(null);


  // Temporales
  const [tempName, setTempName] = useState("");
  const [tempMeds, setTempMeds] = useState<string[]>([]);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);
  const [tempContacts, setTempContacts] = useState<EmergencyContact[]>([]);
  const [tempOperations, setTempOperations] = useState<Operation[]>([]);
  const [tempTreatment, setTempTreatment] = useState("");

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!patientId) return;
      try {
        setLoading(true);
        const patientData = await apiService.patients.getOne(patientId);
        setPatient(patientData);

        if (user?.id) {
          try {
            const photoData = await apiService.users.getProfilePicture(user.id);
            setUserPhoto(photoData);
          } catch {
            console.log("No profile picture found");
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, user?.id]);

  // Permisos
  const canEdit = (field: keyof Patient): boolean =>
    PATIENT_PERMISSIONS.patientProfile?.editableFields.has(field) ?? false;

  // Guardar campo
  const saveField = async (field: keyof Patient, value: any) => {
    if (!patient) return false;
    try {
      setSaving(true);
      const updatedPatient = await apiService.patients.update(patient.id, { [field]: value });
      setPatient(updatedPatient);
      Alert.alert("✅ Cambios guardados correctamente");
      return true;
    } catch (error) {
      console.error("Error saving field:", error);
      Alert.alert("❌ Error al guardar. Intenta nuevamente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Nombre
  const startEditingName = () => {
    if (!patient) return;
    setTempName(patient.name);
    setEditingName(true);
  };
  const saveName = async () => {
    if (await saveField("name", tempName)) setEditingName(false);
  };

  // Medicamentos
  const startEditingMeds = () => {
    if (!patient) return;
    setTempMeds([...patient.currentMedications]);
    setEditingMeds(true);
  };
  const saveMeds = async () => {
    if (await saveField("currentMedications", tempMeds)) setEditingMeds(false);
  };

  // Alergias
  const startEditingAllergies = () => {
    if (!patient) return;
    setTempAllergies([...patient.allergies]);
    setEditingAllergies(true);
  };
  const saveAllergies = async () => {
    if (await saveField("allergies", tempAllergies)) setEditingAllergies(false);
  };

  // Contactos
  const startEditingContacts = () => {
    if (!patient) return;
    setTempContacts([...patient.emergencyContacts]);
    setEditingContacts(true);
  };
  const saveContacts = async () => {
    if (await saveField("emergencyContacts", tempContacts)) setEditingContacts(false);
  };

  // Operaciones
  const startEditingOperations = () => {
    if (!patient) return;
    setTempOperations([...patient.operations]);
    setEditingOperations(true);
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
    if (!patient) return;
    setTempTreatment(patient.treatmentSummary);
    setEditingTreatment(true);
  };
  const saveTreatment = async () => {
    if (await saveField("treatmentSummary", tempTreatment)) setEditingTreatment(false);
  };

  // Logout
  const handleLogout = () =>
    Alert.alert("Cerrar sesión", "¿Seguro que deseas salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);

  // 📸 Seleccionar imagen
const pickImage = async () => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") {
    Alert.alert(
      "Permiso requerido",
      "Necesitamos acceso a tus fotos para cambiar la imagen de perfil."
    );
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true, // recorte cuadrado similar al crop del web
    aspect: [1, 1],
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.9,
  });

  if (!result.canceled && result.assets?.length > 0) {
    const uri = result.assets[0].uri;
    setSelectedImageUri(uri);
    await handleImageUpload(uri); // 👈 le pasamos el URI a la otra función
  }
};

// 🚀 Subir imagen
const handleImageUpload = async (uri: string) => {
  try {
    // 1️⃣ redimensionar y comprimir con ImageManipulator
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.WEBP }
    );

    // 2️⃣ optimizar la imagen (usa el URI local)
    const optimizedBlob = await optimizeProfilePicture(manipulated.uri);

    // 3️⃣ subir imagen al backend
    const uploadResult = await apiService.users.uploadProfilePicture(
      user!.id,
      manipulated.uri // 👈 enviamos la URI, no el blob
    );

    // 4️⃣ actualizar estado y avisar
    setUserPhoto(uploadResult.url || manipulated.uri);
    Alert.alert("✅ Imagen actualizada correctamente");
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    Alert.alert("❌ Error", "No se pudo actualizar la foto de perfil");
  }
};


  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.gray}>Cargando datos del paciente...</Text>
      </View>
    );

  if (!patient)
    return (
      <View style={styles.center}>
        <Text style={styles.gray}>No se pudo cargar la información del paciente</Text>
      </View>
    );

  const currentCancerColor = cancerColors[patient.selectedColor || patient.cancerType];

  const initials =
    patient?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "";

  return (
    <ScrollView style={styles.container}>
      {/* Título */}
      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <Text style={styles.title}>Mi Ficha Médica</Text>
        <Text style={styles.subtitle}>Información médica y datos personales</Text>
      </View>

      {/* 🩺 Datos Personales */}
      <View style={styles.personalCard}>
        <View style={styles.row}>
          <User size={20} color={currentCancerColor.color} />
          <Text style={styles.cardTitle}>Datos Personales</Text>
        </View>

        {/* FOTO + BOTÓN */}
        <View style={styles.photoSection}>
          <View style={{ alignItems: "center" }}>
            <View
              style={[
                styles.avatarLarge,
                { backgroundColor: currentCancerColor.color + "40" },
              ]}
            >
              {userPhoto?.url || selectedImageUri ? (
                <Image
                  source={{ uri: (selectedImageUri ?? userPhoto?.url) as string }}
                  style={styles.avatarImg}
                />
              ) : (
                <Text style={styles.avatarFallback}>{initials}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={pickImage}
              disabled={saving}
            >
              <Edit3 size={14} color="#374151" />
              <Text style={styles.changePhotoText}>Cambiar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* INFO */}
        <View style={{ marginTop: 16 }}>
          {/* Nombre + lápiz */}
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Nombre completo</Text>
            {canEdit("name") && !editingName && (
              <TouchableOpacity onPress={startEditingName}>
                <Edit3 size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {editingName ? (
            <View>
              <TextInput
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Nombre completo"
              />
              <View style={styles.rowRight}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                  disabled={saving}
                  onPress={saveName}
                >
                  <Save size={16} color="#fff" />
                  <Text style={styles.btnText}>Guardar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setEditingName(false)}
                >
                  <X size={16} color="#374151" />
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={styles.fieldText}>{patient.name}</Text>
          )}

          {/* Otras secciones */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Edad</Text>
            <Text style={styles.fieldText}>
              {calculateAge(patient.dateOfBirth)} años
            </Text>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>RUT</Text>
            <Text style={styles.fieldText}>{patient.rut}</Text>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.fieldText}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Información Médica */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <AlertCircle size={20} color={currentCancerColor.color} />
            <Text style={styles.cardTitle}>Información Médica</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Diagnóstico</Text>
          <Text style={styles.fieldText}>{patient.diagnosis}</Text>
          <View style={[styles.badge, { backgroundColor: currentCancerColor.color }]}>
            <Text style={styles.badgeText}>Estadio {patient.stage}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Tipo de cáncer</Text>
          <View style={[styles.row, { marginTop: 6 }]}>
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: cancerColors[patient.cancerType].color,
                marginRight: 8,
              }}
            />
            <Text style={styles.fieldText}>{cancerColors[patient.cancerType].name}</Text>
          </View>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Médico tratante</Text>
          <Text style={styles.fieldText}>{patient.careTeam?.[0]?.name || "No asignado"}</Text>
        </View>

        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>ID de ficha médica</Text>
          <Text style={styles.monotext}>{patient.qrCode}</Text>
        </View>
      </View>

      {/* Resumen de Tratamiento */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <AlertCircle size={20} color={currentCancerColor.color} />
            <Text style={styles.cardTitle}>Resumen de Tratamiento</Text>
          </View>
          {canEdit("treatmentSummary") && !editingTreatment && (
            <TouchableOpacity onPress={startEditingTreatment}>
              <Edit3 size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {editingTreatment ? (
          <>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: "top" }]}
              multiline
              value={tempTreatment}
              onChangeText={setTempTreatment}
              placeholder="Resumen del tratamiento"
            />
            <View style={styles.rowRight}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                onPress={saveTreatment}
                disabled={saving}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingTreatment(false)}
              >
                <X size={16} color="#374151" />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.bodyText}>{patient.treatmentSummary}</Text>
        )}
      </View>

      {/* Alergias */}
      <View style={[styles.card, { borderColor: "#FECACA", borderWidth: 1 }]}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <AlertCircle size={20} color="#DC2626" />
            <Text style={[styles.cardTitle, { color: "#DC2626" }]}>Alergias</Text>
          </View>
          {canEdit("allergies") && !editingAllergies && (
            <TouchableOpacity onPress={startEditingAllergies}>
              <Edit3 size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {editingAllergies ? (
          <>
            {tempAllergies.map((allergy, index) => (
              <View key={index} style={[styles.row, { gap: 8, marginTop: 8 }]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={allergy}
                  onChangeText={(v) => {
                    const arr = [...tempAllergies];
                    arr[index] = v;
                    setTempAllergies(arr);
                  }}
                  placeholder="Nombre de la alergia"
                />
                <TouchableOpacity
                  onPress={() =>
                    setTempAllergies(tempAllergies.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => setTempAllergies([...tempAllergies, ""])}
            >
              <Plus size={16} color={currentCancerColor.color} />
              <Text style={styles.colorText}>Agregar Alergia</Text>
            </TouchableOpacity>

            <View style={styles.rowRight}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                onPress={saveAllergies}
                disabled={saving}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingAllergies(false)}
              >
                <X size={16} color="#374151" />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : patient.allergies.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {patient.allergies.map((a, i) => (
              <Text key={i} style={{ color: "#B91C1C", marginTop: 4 }}>
                ⚠️ {a}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.graySmall}>Sin alergias registradas</Text>
        )}
      </View>

      {/* Medicamentos Actuales */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Pill size={20} color={currentCancerColor.color} />
            <Text style={styles.cardTitle}>Medicamentos Actuales</Text>
          </View>
          {canEdit("currentMedications") && !editingMeds && (
            <TouchableOpacity onPress={startEditingMeds}>
              <Edit3 size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {editingMeds ? (
          <>
            {tempMeds.map((med, index) => (
              <View key={index} style={[styles.row, { gap: 8, marginTop: 8 }]}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={med}
                  onChangeText={(v) => {
                    const arr = [...tempMeds];
                    arr[index] = v;
                    setTempMeds(arr);
                  }}
                  placeholder="Nombre del medicamento"
                />
                <TouchableOpacity
                  onPress={() =>
                    setTempMeds(tempMeds.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => setTempMeds([...tempMeds, ""])}
            >
              <Plus size={16} color={currentCancerColor.color} />
              <Text style={styles.colorText}>Agregar Medicamento</Text>
            </TouchableOpacity>

            <View style={styles.rowRight}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                onPress={saveMeds}
                disabled={saving}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingMeds(false)}
              >
                <X size={16} color="#374151" />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : patient.currentMedications.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {patient.currentMedications.map((m, i) => (
              <Text key={i} style={styles.graySmall}>
                • {m}
              </Text>
            ))}
          </View>
        ) : (
          <Text style={styles.graySmall}>Sin medicamentos registrados</Text>
        )}
      </View>

      {/* Contactos de Emergencia */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Phone size={20} color={currentCancerColor.color} />
            <Text style={styles.cardTitle}>Contactos de Emergencia</Text>
          </View>
          {canEdit("emergencyContacts") && !editingContacts && (
            <TouchableOpacity onPress={startEditingContacts}>
              <Edit3 size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {editingContacts ? (
          <>
            {tempContacts.map((c, i) => (
              <View key={i} style={styles.cardSub}>
                <View style={styles.rowBetween}>
                  <Text style={styles.smallStrong}>Contacto {i + 1}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTempContacts(tempContacts.filter((_, x) => x !== i))
                    }
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={c.name}
                  onChangeText={(v) => {
                    setTempContacts((prev) =>
                      prev.map((it, idx) => (idx === i ? { ...it, name: v } : it))
                    );
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Relación (ej: Madre, Esposo)"
                  value={c.relationship}
                  onChangeText={(v) => {
                    setTempContacts((prev) =>
                      prev.map((it, idx) =>
                        idx === i ? { ...it, relationship: v } : it
                      )
                    );
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  keyboardType="phone-pad"
                  value={c.phone}
                  onChangeText={(v) => {
                    setTempContacts((prev) =>
                      prev.map((it, idx) => (idx === i ? { ...it, phone: v } : it))
                    );
                  }}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                setTempContacts([...tempContacts, { name: "", relationship: "", phone: "" }])
              }
            >
              <Plus size={16} color={currentCancerColor.color} />
              <Text style={styles.colorText}>Agregar Contacto</Text>
            </TouchableOpacity>

            <View style={styles.rowRight}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                onPress={saveContacts}
                disabled={saving}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingContacts(false)}
              >
                <X size={16} color="#374151" />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : patient.emergencyContacts.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {patient.emergencyContacts.map((c, i) => (
              <View key={i} style={{ marginTop: 6 }}>
                <Text style={styles.fieldText}>{c.name}</Text>
                <Text style={styles.graySmall}>{c.relationship}</Text>
                <Text
                  style={[styles.graySmall, { color: currentCancerColor.color }]}
                  onPress={() => Linking.openURL(`tel:${c.phone}`)}
                >
                  {c.phone}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.graySmall}>Sin contactos de emergencia registrados</Text>
        )}
      </View>

      {/* Intervenciones Quirúrgicas */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Scissors size={20} color={currentCancerColor.color} />
            <Text style={styles.cardTitle}>Intervenciones Quirúrgicas</Text>
          </View>
          {canEdit("operations") && !editingOperations && (
            <TouchableOpacity onPress={startEditingOperations}>
              <Edit3 size={18} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {editingOperations ? (
          <>
            {tempOperations.map((op, index) => (
              <View key={index} style={styles.cardSub}>
                <View style={styles.rowBetween}>
                  <Text style={styles.smallStrong}>Operación {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTempOperations(tempOperations.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  value={op.procedure}
                  onChangeText={(v) => {
                    setTempOperations((prev) =>
                      prev.map((it, idx) => (idx === index ? { ...it, procedure: v } : it))
                    );
                  }}
                  placeholder="Procedimiento"
                />
                {/* En mobile simple: campo de texto para fecha (YYYY-MM-DD). Si usas DateTimePicker, lo puedes integrar aquí. */}
                <Pressable onPress={() => setShowDatePicker(index)}>
                <TextInput
                  placeholder="Fecha"
                  value={op.date}
                  editable={false}
                  style={styles.input}
                />
              </Pressable>

              {showDatePicker === index && (
                <DateTimePicker
                  value={op.date ? new Date(op.date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(null);
                    if (selectedDate) {
                      updateOperation(index, "date", selectedDate.toISOString());
                    }
                  }}
                />
              )}

                <TextInput
                  style={styles.input}
                  value={op.hospital}
                  onChangeText={(v) => {
                    setTempOperations((prev) =>
                      prev.map((it, idx) => (idx === index ? { ...it, hospital: v } : it))
                    );
                  }}
                  placeholder="Hospital"
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                setTempOperations([
                  ...tempOperations,
                  { date: "", procedure: "", hospital: "" },
                ])
              }
            >
              <Plus size={16} color={currentCancerColor.color} />
              <Text style={styles.colorText}>Agregar Operación</Text>
            </TouchableOpacity>

            <View style={styles.rowRight}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: currentCancerColor.color }]}
                onPress={saveOperations}
                disabled={saving}
              >
                <Save size={16} color="#fff" />
                <Text style={styles.btnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingOperations(false)}
              >
                <X size={16} color="#374151" />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : patient.operations.length > 0 ? (
          <View style={{ marginTop: 6 }}>
            {patient.operations.map((operation, i) => (
              <View
                key={i}
                style={[
                  styles.leftBorder,
                  { borderLeftColor: currentCancerColor.color },
                ]}
              >
                <Text style={styles.fieldText}>{operation.procedure}</Text>
                <Text style={styles.graySmall}>{operation.hospital}</Text>
                <Text style={styles.graySmall}>{formatDate(operation.date)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.graySmall}>Sin Intervenciones Quirúrgicas registradas</Text>
        )}
      </View>

      {/* Personalización de Color */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Palette size={20} color={currentCancerColor.color} />
          <Text style={styles.cardTitle}>Personalización de Color</Text>
        </View>
        <Text style={styles.graySmall}>
          Elige el color que más te represente para personalizar tu experiencia
        </Text>

        <View style={styles.colorGrid}>
          {Object.entries(cancerColors).map(([type, config]) => {
            const isSelected = (patient.selectedColor || patient.cancerType) === type;
            const isOriginalType = patient.cancerType === type;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.colorItem,
                  isSelected ? styles.colorItemSelected : styles.colorItemDefault,
                ]}
                disabled={saving}
                onPress={async () => {
                  const ok = await saveField("selectedColor", type as CancerType);
                  if (ok) {
                    // ya se actualizó el patient en saveField
                  }
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: config.color,
                    marginBottom: 6,
                  }}
                />
                <Text style={styles.colorName}>{config.name}</Text>
                {isOriginalType && (
                  <Text style={styles.colorHint}>(Tu diagnóstico)</Text>
                )}
                {isSelected && <View style={styles.dotSelected} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={[
            styles.colorPreview,
            { backgroundColor: currentCancerColor.color + "20" },
          ]}
        >
          <Text style={[styles.graySmall, { color: currentCancerColor.color }]}>
            <Text style={{ fontWeight: "700" }}>Color actual:</Text>{" "}
            {currentCancerColor.name}
            {patient.selectedColor && patient.selectedColor !== patient.cancerType && (
              <Text style={{ fontSize: 12 }}> (Personalizado)</Text>
            )}
          </Text>
        </View>
      </View>

      {/* Seguridad */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Lock size={20} color={currentCancerColor.color} />
          <Text style={styles.cardTitle}>Seguridad</Text>
        </View>
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: "#DC2626", marginTop: 10 }]}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#DC2626" />
          <Text style={{ color: "#DC2626", fontWeight: "600" }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  gray: { color: "#6B7280" },
  graySmall: { color: "#6B7280", fontSize: 13, marginTop: 2 },
  bodyText: { color: "#374151", fontSize: 14, marginTop: 6, lineHeight: 20 },

  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { color: "#6B7280", marginTop: 2 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,

    width: "108%",        // ocupa más ancho que el padding del ScrollView
    alignSelf: "center",  // centra el recuadro
    marginLeft: -10,   
  },
  cardSub: { backgroundColor: "#F9FAFB", borderRadius: 8, padding: 8, marginTop: 8 },
  cardTitle: { fontWeight: "700", fontSize: 16, marginLeft: 8, color: "#111827" },

  label: { fontSize: 12, color: "#6B7280" },
  fieldText: { fontSize: 15, color: "#111827", marginTop: 4 },
  monotext: {
    fontFamily: "Courier",
    backgroundColor: "#F3F4F6",
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    color: "#111827",
  },

  badge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginTop: 6,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  row: { flexDirection: "row", alignItems: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowRight: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#F9FAFB",
    marginTop: 6,
    color: "#111827",
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    marginLeft: 8,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  cancelText: { color: "#374151", fontWeight: "700" },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
    gap: 6,
    backgroundColor: "#fff",
  },
  colorText: { color: "#374151", fontWeight: "700" },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { color: "#111827", fontWeight: "800", fontSize: 20 },

  leftBorder: {
    borderLeftWidth: 4,
    paddingLeft: 10,
    paddingVertical: 6,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginTop: 6,
  },

  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  colorItem: {
    width: "31.5%",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  colorItemDefault: { borderColor: "#E5E7EB", backgroundColor: "#fff" },
  colorItemSelected: { borderColor: "#111827", backgroundColor: "#F9FAFB" },
  colorName: { fontSize: 11, textAlign: "center", color: "#111827" },
  colorHint: { fontSize: 10, color: "#6B7280", marginTop: 2 },
  dotSelected: { width: 6, height: 6, backgroundColor: "#111827", borderRadius: 3, marginTop: 4 },
  colorPreview: { marginTop: 12, padding: 12, borderRadius: 10 },

  smallStrong: {
  fontSize: 12,
  fontWeight: "700",
  color: "#374151",
  },
  
  personalCard: {
  backgroundColor: "#fff",
  borderRadius: 16,
  paddingVertical: 22,
  paddingHorizontal: 18,
  marginTop: 16,
  elevation: 3,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 6,
  minHeight: 320,

  // 💡 agrandar horizontalmente el recuadro blanco:
  width: "108%",        // ocupa más ancho que el padding del ScrollView
  alignSelf: "center",  // centra el recuadro
  marginLeft: -10,      // compensa el padding lateral del ScrollView
},


photoSection: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 16,
  marginBottom: 4,
},

avatarLarge: {
  width: 100,
  height: 100,
  borderRadius: 50,
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
},

changePhotoBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "#D1D5DB",
  borderRadius: 10,
  paddingVertical: 8,
  paddingHorizontal: 14,
  backgroundColor: "#F9FAFB",
  marginTop: 10,
},

changePhotoText: {
  color: "#374151",
  fontWeight: "700",
  marginLeft: 6,
  fontSize: 14,
},

});
