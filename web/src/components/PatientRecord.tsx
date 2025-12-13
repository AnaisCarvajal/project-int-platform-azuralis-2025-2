/**
 * PatientRecord Component
 * 
 * Displays complete patient medical record with tabs for:
 * - General information (medications, contacts, operations)
 * - Medical notes
 * - Documents
 * - Care team management
 * 
 * @param {Patient} patient - Patient data object
 * @param {Function} onBack - Callback function to navigate back
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  AlertTriangle,
  Calendar,
  User,
  Pill,
  Scissors,
  FileText,
  StickyNote,
  Activity,
} from "lucide-react";
import type { Patient } from "@/types/medical";
import { cancerColors } from "@/types/medical";
import { CancerRibbon } from "./CancerRibbon";
import { ManageCareTeam } from "./ManageCareTeam";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import LogoUniversidad from "../assets/logo_ucn.svg?react";
import { calculateAge } from "@/common/helpers/CalculateAge";

interface PatientRecordProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientRecord({ patient, onBack }: PatientRecordProps) {
  const cancerColor = cancerColors[patient.cancerType];
  const { user } = useAuth();
  const isStaff = user?.role === 'doctor' || user?.role === 'nurse';
  
  // Helper function to parse JSON strings to arrays
  const parseJsonArray = (value: any): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Parse allergies and medications
  const allergies = parseJsonArray(patient.allergies);
  const medications = parseJsonArray(patient.currentMedications);
  
  const [notes, setNotes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [displayDocuments, setDisplayDocuments] = useState<any[]>([]); // Documentos ordenados para mostrar
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  // Load patient notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoadingNotes(true);
        const patientNotes = await apiService.patients.getNotes(patient.id);
        setNotes(patientNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
        setNotes([]);
      } finally {
        setLoadingNotes(false);
      }
    };

    loadNotes();
  }, [patient.id]);

  // Load patient documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const patientDocuments = await apiService.patients.getDocuments(patient.id);
        setDocuments(patientDocuments);
      } catch (error) {
        console.error('Error loading documents:', error);
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [patient.id]);

  // Separar documentos del Comité Oncológico de otros documentos
  useEffect(() => {
    // Separar documentos del Comité Oncológico usando el campo isComiteOncologico
    const comiteDocs = documents.filter(doc => doc.isComiteOncologico === true);
    const otherDocs = documents.filter(doc => doc.isComiteOncologico !== true);
    
    // Poner los documentos del Comité Oncológico al principio
    setDisplayDocuments([...comiteDocs, ...otherDocs]);
  }, [documents]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const callEmergencyContact = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const getDocumentBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      examen: "#3b82f6",
      cirugia: "#ef4444",
      quimioterapia: "#8b5cf6",
      radioterapia: "#f59e0b",
    };
    return colors[type] || "#6b7280";
  };

  const getRoleName = (role: string): string => {
    const roleNames: Record<string, string> = {
      oncologo_principal: "Oncólogo Principal",
      enfermera_jefe: "Enfermera Jefe",
      cirujano: "Cirujano",
      radiologo: "Radiólogo",
      consultor: "Consultor",
    };
    // Si el rol existe en el diccionario, devolverlo formateado
    // Si no existe, capitalizar la primera letra y reemplazar guiones bajos con espacios
    if (roleNames[role]) {
      return roleNames[role];
    }
    // Formatear rol personalizado: "mi_rol_custom" → "Mi Rol Custom"
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para abrir/descargar el documento con URL firmada
  const downloadDocument = async (docId: string) => {
    try {
      const { url } = await apiService.documents.getDownloadUrl(docId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error al abrir documento:', error);
      alert('❌ Error al abrir el documento. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al buscador
            </Button>
            {/* LOGOS */}
            <div className="flex items-center justify-center space-x-3">
              <CancerRibbon className="text-[#ff6299]" size="lg" />
              <LogoUniversidad className="w-8 h-8 " />
            </div>
          </div>

          {/* Patient Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={patient.photo} alt={patient.name} />
              <AvatarFallback
                className="text-lg"
                style={{ backgroundColor: cancerColor.color + "40" }}
              >
                {patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                {patient.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>{calculateAge(patient.dateOfBirth)} años</span>
                <span>RUT: {patient.rut}</span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Badge
                  className="text-white border-0"
                  style={{ backgroundColor: cancerColor.color }}
                >
                  {cancerColor.name}
                </Badge>
                <Badge variant="outline">
                  {patient.diagnosis} - {patient.stage}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Critical Information Alert */}
        {allergies.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ ALERGIAS:</strong> {allergies.join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs para organizar la información */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Activity className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="w-4 h-4 mr-2" />
              Notas ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documentos ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="team">
              <User className="w-4 h-4 mr-2" />
              Equipo
            </TabsTrigger>
          </TabsList>

          {/* TAB: INFORMACIÓN GENERAL */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Pill
                      className="w-5 h-5"
                      style={{ color: cancerColor.color }}
                    />
                    <span>Medicamentos Actuales</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {medications.length > 0 ? (
                    <ul className="space-y-2">
                      {medications.map((med, index) => (
                        <li
                          key={index}
                          className="text-sm bg-gray-50 p-3 rounded-lg flex items-start"
                        >
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 mr-2"
                            style={{ backgroundColor: cancerColor.color }}
                          ></div>
                          {med}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Sin medicamentos registrados
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contacts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>Contactos de Emergencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patient.emergencyContacts && patient.emergencyContacts.length > 0 ? (
                      patient.emergencyContacts.map((contact, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-gray-600">
                              {contact.relationship}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {contact.phone}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => callEmergencyContact(contact.phone)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Llamar
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No hay contactos de emergencia registrados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Medical History */}
              {patient.operations && patient.operations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Scissors
                        className="w-5 h-5"
                        style={{ color: cancerColor.color }}
                      />
                      <span>Intervenciones Quirúrgicas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patient.operations.map((operation, index) => (
                        <div
                          key={index}
                          className="border-l-4 pl-4 py-2"
                          style={{ borderColor: cancerColor.color }}
                        >
                          <p className="font-medium text-sm">
                            {operation.procedure}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {formatDate(operation.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {operation.hospital}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Treatment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity
                      className="w-5 h-5"
                      style={{ color: cancerColor.color }}
                    />
                    <span>Estado del Tratamiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-4">
                    {patient.treatmentSummary}
                  </p>
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: cancerColor.color + "20" }}
                  >
                    <p className="text-xs font-semibold mb-2 text-gray-600">
                      Diagnóstico: {patient.diagnosis} • {patient.stage}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: NOTAS MÉDICAS */}
          <TabsContent value="notes" className="space-y-4 mt-6">
            {loadingNotes ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Cargando notas...</p>
                </CardContent>
              </Card>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <StickyNote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No hay notas médicas registradas
                  </p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {note.authorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(note.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <StickyNote className="w-3 h-3 mr-1" />
                        Nota Médica
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB: DOCUMENTOS */}
          <TabsContent value="documents" className="space-y-4 mt-6">
            {loadingDocuments ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Cargando documentos...</p>
                </CardContent>
              </Card>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    No hay documentos registrados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Sección del Comité Oncológico */}
                {displayDocuments.filter(doc => doc.isComiteOncologico === true).length > 0 && (
                  <Card className="bg-purple-50 border-purple-300 shadow-lg overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl mb-4 text-purple-900">Comité Oncológico</h3>
                      <div className="space-y-3">
                        {displayDocuments
                          .filter(doc => doc.isComiteOncologico === true)
                          .map((doc) => (
                            <div key={doc.id} className="bg-white rounded-lg p-4 border border-purple-200 hover:shadow-md transition-shadow">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-purple-900 mb-1">{doc.title}</h4>
                                  <div className="flex items-center space-x-2 text-purple-600">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-sm">{formatDate(doc.uploadDate)}</span>
                                  </div>
                                </div>
                                <Button
                                  variant="default"
                                  onClick={() => downloadDocument(doc.id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white ml-4"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Abrir
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resto de documentos en grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {displayDocuments
                    .filter(doc => doc.isComiteOncologico !== true)
                    .map((doc) => (
                      <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                            <CardTitle className="text-base">
                              {doc.title}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(doc.uploadDate)}
                            </p>
                          </div>
                          <Badge
                            style={{
                              backgroundColor: getDocumentBadgeColor(doc.type),
                            }}
                            className="text-white"
                          >
                            {doc.type}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => downloadDocument(doc.id)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Abrir
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: EQUIPO DE CUIDADOS */}
          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User
                    className="w-5 h-5"
                    style={{ color: cancerColor.color }}
                  />
                  <span>Equipo de Cuidados</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {patient.careTeam && patient.careTeam.length > 0 ? (
                    patient.careTeam.map((member, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: cancerColor.color }}
                        >
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-gray-600">
                            {getRoleName(member.role)}
                          </p>
                        </div>
                        <Badge
                          variant={member.status === "active" ? "default" : "secondary"}
                        >
                          {member.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))
                  ) : (
                    <p className="text-sm text-gray-500">No hay equipo de cuidados asignado</p>
                  )}
                </div>

                {/* Manage Care Team - Solo visible para doctor/nurse */}
                {isStaff && (
                  <ManageCareTeam
                    patient={patient}
                    onUpdate={() => {
                      // Recargar datos del paciente si es necesario
                      window.location.reload();
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar
                className="w-5 h-5"
                style={{ color: cancerColor.color }}
              />
              <span>Información de Ficha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ID de Ficha Médica</p>
              <p className="font-mono font-medium text-lg mt-1">
                {patient.qrCode}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add some bottom padding to avoid fixed navigation overlap */}
      <div className="h-20"></div>
    </div>
  );
}
