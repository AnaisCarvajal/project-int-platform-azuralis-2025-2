// clinicalDashboardStaff
import React, { useEffect, useMemo, useState } from "react";
import {ActivityIndicator,Alert,Image,ScrollView,StyleSheet,Text,TouchableOpacity,View,} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";


import { useAuth } from "../../context/AuthContext";
import { BottomNavigation } from "../../components/BottomNavigation";
import { clinicalStaffTabs } from "../../common/config/navigationsTabs";
import type { DoctorUser, NurseUser, Patient } from "../../types/medical";
import {ScanPatientQR} from "../../components/ScanPatientQR"
import { EditablePatientRecord } from "../../components/EditablePatientRecord";
import { CompleteDoctorProfile } from "../../components/CompleteDoctorProfile";
import { CompleteNurseProfile } from "../../components/CompleteNurseProfile";
import { CareTeamPatientsList } from "../../components/CareTeamPatientsList";
import { apiService } from "../../services/api";

interface Stats {
  totalPatients: number;
  searchHistory: number;
  myPatients: number;
}

type Props = {
  // Si usas React Navigation:
  navigation?: any;
};

export function DashboardClinicalStaff({ navigation }: Props) {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("home");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    searchHistory: 0,
    myPatients: 0,
  });

  const [userPhoto, setUserPhoto] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isDoctor = user?.role === "doctor";
  const isNurse = user?.role === "nurse";
  const accentColor = isDoctor ? "#001663" : "#00B4D8";
  const roleLabel = isDoctor ? "Doctor" : "Enfermera";

  // Load user profile picture
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (!user?.id) return;
      try {
        const photoData = await apiService.users.getProfilePicture(user.id);
        setUserPhoto(photoData);
      } catch {
        // no photo
      }
    };
    loadUserPhoto();
  }, [user?.id]);

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!user || (!isDoctor && !isNurse)) return;

      try {
        const allPatients = await apiService.patients.getAll();
        const clinicalUser = user as DoctorUser | NurseUser;

        const myPatients = allPatients.filter((patient: Patient) =>
          patient.careTeam?.some((member) => {
            return (
              (member.userId || "").toLowerCase() === (user.id || "").toLowerCase()
            );
          })
        );

        setStats({
          totalPatients: allPatients.length,
          searchHistory: clinicalUser.searchHistory?.length || 0,
          myPatients: myPatients.length,
        });
      } catch (error) {
        console.error("Error loading statistics:", error);
        setStats({ totalPatients: 0, searchHistory: 0, myPatients: 0 });
      }
    };

    if (!needsProfileCompletion) loadStats();
  }, [user, needsProfileCompletion, isDoctor, isNurse]);


  const handleProfileComplete = () => {
    setNeedsProfileCompletion(false);
  };

  const handleLogout = () => {
    logout();
    // si usas navigation:
    if (navigation?.navigate) navigation.navigate("Login");
  };

  const onTabChange = (tabId: string) => {
    setActiveTab(tabId);

    if (tabId === "search") {
      setShowSearch(true);
      setSelectedPatient(null);
    } else {
      setShowSearch(false);
      setSelectedPatient(null);
    }
  };

  const handlePatientFound = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowSearch(false);

    try {
      console.log("Paciente encontrado:", patient.id, patient.rut);
    } catch (error) {
      console.error("Error al guardar historial:", error);
    }
  };

  const handleBackFromSearch = () => {
    setShowSearch(false);
    setActiveTab("home");
  };

  const handleBackFromRecord = () => {
    setSelectedPatient(null);
    setActiveTab("careTeam");
  };

  // ✅ Reemplazo de <input type="file"> + ImageCropDialog:
  // Usamos ImagePicker con recorte cuadrado (allowsEditing + aspect).
  const pickAndUploadProfilePhoto = async () => {
    if (!user) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,       // recorte integrado
      aspect: [1, 1],            // cuadrado
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    try {
      setUploadingPhoto(true);

      // Tu apiService web recibe File. En RN debes subir con FormData usando { uri, name, type }.
      // Aquí le pasamos un objeto “file-like” RN.
      const rnFile = {
        uri: asset.uri,
        name: "profile-picture.jpg",
        mimeType: "image/jpeg",
      };

      const uploaded = await apiService.users.uploadProfilePicture(user.id, rnFile as any);
      setUserPhoto(uploaded);

      Alert.alert("✅ Listo", "Foto de perfil actualizada correctamente");
    } catch (e) {
      console.error("Error uploading profile picture:", e);
      Alert.alert("❌ Error", "Error al subir la foto. Intenta nuevamente.");
    } finally {
      setUploadingPhoto(false);
    }
  };
  const ProfileHeader = useMemo(() => {
    const initial = (user?.name?.charAt(0) || "?").toUpperCase();
    const subtitle = isDoctor
      ? `Especialización: ${(user as DoctorUser)?.specialization || "-"}`
      : `Departamento: ${(user as NurseUser)?.department || "-"}`;

    return (
        <LinearGradient
        colors={[accentColor, `${accentColor}DD`]}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            {userPhoto?.url ? (
              <Image source={{ uri: userPhoto.url }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: "#ffffff33" }]}>
                <Text style={[styles.avatarLetter, { color: "#fff" }]}>{initial}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{user?.name}</Text>
            <View style={styles.headerInfoRow}>
            <Ionicons name="medkit-outline" size={16} color="white" />
            <Text style={styles.headerText}>{subtitle}</Text>
          </View>

          <View style={styles.headerInfoRow}>
            <Ionicons name="mail-outline" size={16} color="white" />
            <Text style={styles.headerText}>{user?.email}</Text>
          </View>

          </View>
        </View>
      </LinearGradient>
    );
  }, [user, userPhoto]);

  // Show profile completion form if needed
  if (needsProfileCompletion) {
    return isDoctor ? (
      <CompleteDoctorProfile onComplete={handleProfileComplete} />
    ) : (
      <CompleteNurseProfile onComplete={handleProfileComplete} />
    );
  }

  // Si está buscando, mostrar el buscador CON bottom navigation
  if (showSearch) {
    return (
      <View style={styles.screen}>
        <ScanPatientQR onPatientFound={handlePatientFound} onBack={handleBackFromSearch} />
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          accentColor={accentColor}
          tabs={clinicalStaffTabs}
        />
      </View>
    );
  }

  // Si seleccionó un paciente, mostrar su ficha CON bottom navigation
  if (selectedPatient) {
    return (
      <View style={styles.screen}>
        <EditablePatientRecord patient={selectedPatient} onBack={handleBackFromRecord} />
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          accentColor={accentColor}
          tabs={clinicalStaffTabs}
        />
      </View>
    );
  }




  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <View style={{ marginTop: 14, gap: 12 }}>
            <Card style={styles.welcomeCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons name="checkmark-circle" size={26} color="#fff" />
              <Text style={styles.welcomeTitle}>¡Bienvenido/a de vuelta!</Text>
            </View>

            <Text style={styles.welcomeSubtitle}>
              Panel de {roleLabel} - Ficha Médica Portátil Lacito
            </Text>

            <View style={styles.datePill}>
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("es-CL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </View>
          </Card>

            <View style={styles.statsGrid}>
            <StatCard
              title="MIS PACIENTES"
              value={stats.myPatients}
              subtitle="Pacientes asignados"
              icon="people"
              accentColor="#2563EB"
            />

            <StatCard
              title="BÚSQUEDAS"
              value={stats.searchHistory}
              subtitle="Registros consultados"
              icon="search"
              accentColor="#22C55E"
            />

            <StatCard
              title="PACIENTES TOTALES"
              value={stats.totalPatients}
              subtitle="Pacientes registrados"
              icon="documents"
              accentColor="#8B5CF6"
            />
          </View>
        </View>
      );

      case "careTeam":
        return (
          <View style={{ marginTop: 14 }}>
            <CareTeamPatientsList onPatientSelect={setSelectedPatient} />
          </View>
        );

      case "profile": {
        const clinicalUser = user as DoctorUser | NurseUser;

        return (
          <View style={{ marginTop: 14, gap: 12 }}>
            <Card>
              <Text style={styles.sectionTitle}>Foto de Perfil</Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.smallAvatarWrap}>
                  {userPhoto?.url ? (
                    <Image source={{ uri: userPhoto.url }} style={styles.smallAvatarImg} />
                  ) : (
                    <View style={[styles.smallAvatarFallback, { backgroundColor: `${accentColor}40` }]}>
                      <Text style={[styles.smallAvatarLetter, { color: accentColor }]}>
                        {(user?.name?.charAt(0) || "?").toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <OutlineButton
                    title={uploadingPhoto ? "Subiendo..." : "Cambiar Foto"}
                    onPress={pickAndUploadProfilePhoto}
                    disabled={uploadingPhoto}
                  />
                  <Text style={styles.helperText}>
                    Formatos: JPG, PNG. Tamaño máximo: 5MB
                  </Text>
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>Información Profesional</Text>

              <InfoRow label="RUT" value={user?.rut || "-"} />
              {isDoctor && (
                <InfoRow
                  label="Especialidad"
                  value={(clinicalUser as DoctorUser).specialization || "-"}
                />
              )}
              {isNurse && (
                <InfoRow
                  label="Departamento"
                  value={(clinicalUser as NurseUser).department || "-"}
                />
              )}
              <InfoRow label="Licencia" value={(clinicalUser as any).license || "-"} />
            </Card>

            <OutlineButton title="Cerrar Sesión" onPress={handleLogout} />
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 120 }]}>
        {ProfileHeader}
        {renderContent()}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        accentColor={accentColor}
        tabs={clinicalStaffTabs}
      />
    </SafeAreaView>
  );
}

/* ---------------- UI helpers ---------------- */

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function StatCard({
  title,
  value,
  accentColor,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}) {
  return (
    <View style={[styles.statCardBig, { backgroundColor: `${accentColor}12` }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIconWrap, { backgroundColor: accentColor }]}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={[styles.statTitle, { color: accentColor }]}>{title}</Text>
      </View>

      <Text style={[styles.statBigValue, { color: accentColor }]}>{value}</Text>
      <Text style={[styles.statSubtitle, { color: accentColor }]}>{subtitle}</Text>
    </View>
  );
}



function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnPrimary, disabled && { opacity: 0.6 }]}
    >
      <Text style={styles.btnPrimaryText}>{title}</Text>
    </TouchableOpacity>
  );
}

function OutlineButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btnOutline, disabled && { opacity: 0.6 }]}
    >
      <Text style={styles.btnOutlineText}>{title}</Text>
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { padding: 14, paddingBottom: 0 },

  headerGradient: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: "hidden" },
  avatarImg: { width: "100%", height: "100%" },
  avatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 28, fontWeight: "800" },
  headerName: { color: "white", fontSize: 20, fontWeight: "800" },
  headerText: { color: "white", marginTop: 2 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },

  welcomeCard: {
    backgroundColor: "#2563EB",
  },
  welcomeTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  welcomeSubtitle: { color: "#DBEAFE", marginTop: 6 },

  statsRow: {  gap: 14, },
  statCard: {
    width: "100%",
    borderRadius: 18,
    padding: 18,
  },
  statLabel: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  statValue: { color: "#111827", fontWeight: "900", fontSize: 26, marginTop: 6 },

  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 10 },

  btnPrimary: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  btnPrimaryText: { color: "white", fontWeight: "900" },

  btnOutline: {
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  btnOutlineText: { color: "#111827", fontWeight: "900" },

  helperText: { color: "#6B7280", marginTop: 6, fontSize: 12 },

  smallAvatarWrap: { width: 56, height: 56, borderRadius: 28, overflow: "hidden" },
  smallAvatarImg: { width: "100%", height: "100%" },
  smallAvatarFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  smallAvatarLetter: { fontSize: 18, fontWeight: "900" },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  infoLabel: { color: "#6B7280", fontWeight: "700" },
  infoValue: { color: "#111827", fontWeight: "800" },
  statsGrid: {gap: 14,},

statCardBig: {
  width: "100%",
  borderRadius: 18,
  padding: 18,
  minHeight: 130,
  justifyContent: "space-between",
},

statHeader: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

statTitle: {
  color: "#E0E7FF",
  fontWeight: "800",
  fontSize: 12,
},

statBigValue: {
  color: "#FFFFFF",
  fontSize: 32,
  fontWeight: "900",
},

statSubtitle: {
  color: "#E0E7FF",
  fontSize: 13,
},

datePill: {
  marginTop: 10,
  alignSelf: "flex-start",
  backgroundColor: "rgba(255,255,255,0.2)",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 999,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

dateText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 12,
},

headerInfoRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 4,
},

statIconWrap: {
  width: 36,
  height: 36,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
},

});

