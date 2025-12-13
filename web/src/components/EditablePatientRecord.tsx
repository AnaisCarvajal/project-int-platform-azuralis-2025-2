/**
 * EditablePatientRecord Component
 * 
 * Enhanced patient record with inline editing capabilities
 * - Doctors can edit ALL fields
 * - Nurses can only edit: currentMedications, treatmentSummary
 * - All changes are saved to database via API
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Camera,
  FolderOpen,
} from "lucide-react";
import type { Patient, EmergencyContact, Operation } from "@/types/medical";
import { cancerColors, DOCTOR_PERMISSIONS, NURSE_PERMISSIONS } from "@/types/medical";
import { CancerRibbon } from "./CancerRibbon";
import { ManageCareTeam } from "./ManageCareTeam";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { calculateAge } from "@/common/helpers/CalculateAge";
import { optimizeMedicalDocument, getReadableFileSize } from "@/common/helpers/ImageOptimizer";
import LogoUniversidad from "../assets/logo_ucn.svg?react";

interface EditablePatientRecordProps {
  patient: Patient;
  onBack: () => void;
}

export function EditablePatientRecord({ patient: initialPatient, onBack }: EditablePatientRecordProps) {
  const [patient, setPatient] = useState<Patient>(initialPatient);
  const cancerColor = cancerColors[patient.cancerType];
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const isNurse = user?.role === 'nurse';
  const isStaff = isDoctor || isNurse;
  
  // Estados de edición por sección
  const [editingMeds, setEditingMeds] = useState(false);
  const [editingAllergies, setEditingAllergies] = useState(false);
  const [editingContacts, setEditingContacts] = useState(false);
  const [editingOperations, setEditingOperations] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(false);
  
  // Estados temporales para edición
  const [tempMeds, setTempMeds] = useState<string[]>([]);
  const [tempAllergies, setTempAllergies] = useState<string[]>([]);
  const [tempContacts, setTempContacts] = useState<EmergencyContact[]>([]);
  const [tempOperations, setTempOperations] = useState<Operation[]>([]);
  const [tempTreatment, setTempTreatment] = useState("");
  
  const [notes, setNotes] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [displayDocuments, setDisplayDocuments] = useState<any[]>([]); // Documentos ordenados para mostrar
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientPhoto, setPatientPhoto] = useState<any>(null);

  // Estados para crear/editar notas
  const [creatingNote, setCreatingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  
  // Estados para subir documentos
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<string>("examen");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ✅ Archivo real
  const [newDocDescription, setNewDocDescription] = useState("");
  
  // Estados para Comité Oncológico
  const [showComiteTitleModal, setShowComiteTitleModal] = useState(false);
  const [pendingComiteFile, setPendingComiteFile] = useState<File | null>(null);
  const [pendingComiteTitle, setPendingComiteTitle] = useState('Comité Oncológico');
  const [isLoadingComite, setIsLoadingComite] = useState(false);

  // Función para verificar si puede editar un campo
  const canEdit = (field: keyof Patient): boolean => {
    if (!isStaff) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.patientProfile?.editableFields.has(field) || false;
  };

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

  // Load patient profile picture
  useEffect(() => {
    const loadPatientPhoto = async () => {
      try {
        // For now, patients don't have separate profile pictures
        // This could be extended in the future with a patient-specific endpoint
        setPatientPhoto(null);
      } catch (error) {
        console.log('No patient profile picture found');
        setPatientPhoto(null);
      }
    };
    loadPatientPhoto();
  }, [patient.id]);

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
    };
    return roleNames[role] || role;
  };

  // Funciones de guardado
  const saveField = async (field: keyof Patient, value: any) => {
    try {
      setSaving(true);
      const updatedPatient = await apiService.patients.update(patient.id, {
        [field]: value
      });
      setPatient(updatedPatient);
      alert("✅ Cambios guardados correctamente");
      return true;
    } catch (error) {
      console.error('Error saving field:', error);
      alert("❌ Error al guardar. Intenta nuevamente.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Medicamentos
  const startEditingMeds = () => {
    setTempMeds([...patient.currentMedications]);
    setEditingMeds(true);
  };

  const saveMeds = async () => {
    const success = await saveField('currentMedications', tempMeds);
    if (success) setEditingMeds(false);
  };

  const cancelEditingMeds = () => {
    setTempMeds([]);
    setEditingMeds(false);
  };

  const addMed = () => {
    setTempMeds([...tempMeds, '']);
  };

  const removeMed = (index: number) => {
    setTempMeds(tempMeds.filter((_, i) => i !== index));
  };

  const updateMed = (index: number, value: string) => {
    const newMeds = [...tempMeds];
    newMeds[index] = value;
    setTempMeds(newMeds);
  };

  // Alergias
  const startEditingAllergies = () => {
    setTempAllergies([...patient.allergies]);
    setEditingAllergies(true);
  };

  const saveAllergies = async () => {
    const success = await saveField('allergies', tempAllergies);
    if (success) setEditingAllergies(false);
  };

  const cancelEditingAllergies = () => {
    setTempAllergies([]);
    setEditingAllergies(false);
  };

  const addAllergy = () => {
    setTempAllergies([...tempAllergies, '']);
  };

  const removeAllergy = (index: number) => {
    setTempAllergies(tempAllergies.filter((_, i) => i !== index));
  };

  const updateAllergy = (index: number, value: string) => {
    const newAllergies = [...tempAllergies];
    newAllergies[index] = value;
    setTempAllergies(newAllergies);
  };

  // Contactos de emergencia
  const startEditingContacts = () => {
    setTempContacts([...patient.emergencyContacts]);
    setEditingContacts(true);
  };

  const saveContacts = async () => {
    const success = await saveField('emergencyContacts', tempContacts);
    if (success) setEditingContacts(false);
  };

  const cancelEditingContacts = () => {
    setTempContacts([]);
    setEditingContacts(false);
  };

  const addContact = () => {
    setTempContacts([...tempContacts, { name: '', relationship: '', phone: '' }]);
  };

  const removeContact = (index: number) => {
    setTempContacts(tempContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const newContacts = [...tempContacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setTempContacts(newContacts);
  };

  // Operaciones
  const startEditingOperations = () => {
    setTempOperations([...patient.operations]);
    setEditingOperations(true);
  };

  const saveOperations = async () => {
    const success = await saveField('operations', tempOperations);
    if (success) setEditingOperations(false);
  };

  const cancelEditingOperations = () => {
    setTempOperations([]);
    setEditingOperations(false);
  };

  const addOperation = () => {
    setTempOperations([...tempOperations, { date: '', procedure: '', hospital: '' }]);
  };

  const removeOperation = (index: number) => {
    setTempOperations(tempOperations.filter((_, i) => i !== index));
  };

  const updateOperation = (index: number, field: keyof Operation, value: string) => {
    const newOps = [...tempOperations];
    newOps[index] = { ...newOps[index], [field]: value };
    setTempOperations(newOps);
  };

  // Tratamiento
  const startEditingTreatment = () => {
    setTempTreatment(patient.treatmentSummary);
    setEditingTreatment(true);
  };

  const saveTreatment = async () => {
    const success = await saveField('treatmentSummary', tempTreatment);
    if (success) setEditingTreatment(false);
  };

  const cancelEditingTreatment = () => {
    setTempTreatment('');
    setEditingTreatment(false);
  };

  // ==================== FUNCIONES PARA NOTAS ====================
  const canCreateNote = () => {
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.notes?.create || false;
  };

  const canEditNote = (note: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    
    // Si no tiene permiso de update, no puede editar
    if (!permissions.notes?.update) {
      return false;
    }
    
    // Si scope es 'all', puede editar cualquier nota
    if (permissions.notes.scope === 'all') {
      return true;
    }
    
    // Si scope es 'own', solo puede editar sus propias notas
    return note.authorId === user.id;
  };

  const canDeleteNote = (note: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    
    // Si no tiene permiso de delete, no puede borrar
    if (!permissions.notes?.delete) return false;
    
    // Si scope es 'all', puede borrar cualquier nota
    if (permissions.notes.scope === 'all') return true;
    
    // Si scope es 'own', solo puede borrar sus propias notas
    return note.authorId === user.id;
  };

  const createNote = async () => {
    if (!newNoteContent.trim() || !user) {
      alert("Por favor escribe el contenido de la nota");
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
      
      setNotes([newNote, ...notes]);
      setNewNoteContent("");
      setCreatingNote(false);
      alert("✅ Nota creada exitosamente");
    } catch (error) {
      console.error('Error creating note:', error);
      alert("❌ Error al crear la nota");
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
      alert("El contenido de la nota no puede estar vacío");
      return;
    }

    try {
      setSaving(true);
      await apiService.notes.update(noteId, {
        content: editingNoteContent,
      });
      
      // Actualizar la nota en el estado
      setNotes(notes.map(n => n.id === noteId ? { ...n, content: editingNoteContent } : n));
      setEditingNoteId(null);
      setEditingNoteContent("");
      alert("✅ Nota actualizada exitosamente");
    } catch (error) {
      console.error('Error updating note:', error);
      alert("❌ Error al actualizar la nota");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta nota?")) return;

    try {
      setSaving(true);
      await apiService.notes.delete(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      alert("✅ Nota eliminada exitosamente");
    } catch (error) {
      console.error('Error deleting note:', error);
      alert("❌ Error al eliminar la nota");
    } finally {
      setSaving(false);
    }
  };

  // ==================== FUNCIONES PARA DOCUMENTOS ====================
  const canUploadDocument = () => {
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    return permissions.documents?.create || false;
  };

  const canDeleteDocument = (doc: any) => {
    if (!user) return false;
    const permissions = isDoctor ? DOCTOR_PERMISSIONS : NURSE_PERMISSIONS;
    
    // Si no tiene permiso de delete, no puede borrar
    if (!permissions.documents?.delete) return false;
    
    // Si scope es 'all', puede borrar cualquier documento
    if (permissions.documents.scope === 'all') return true;
    
    // Si scope es 'own', solo puede borrar sus propios documentos
    return doc.uploaderId === user.id;
  };

  const uploadDocument = async () => {
    if (!newDocTitle.trim() || !selectedFile) {
      alert("Por favor completa el título y selecciona un archivo");
      return;
    }

    if (!user) return;

    try {
      setSaving(true);
      
      let fileToUpload = selectedFile;
      
      // Si es una imagen, optimizarla antes de subir
      if (selectedFile.type.startsWith('image/')) {
        console.log(`📸 Documento original: ${getReadableFileSize(selectedFile.size)}`);
        const optimizedBlob = await optimizeMedicalDocument(selectedFile);
        console.log(`✨ Documento optimizado: ${getReadableFileSize(optimizedBlob.size)}`);
        
        // Convertir a File manteniendo el nombre original pero con extensión .webp
        const originalName = selectedFile.name.replace(/\.[^.]+$/, '');
        fileToUpload = new File([optimizedBlob], `${originalName}.webp`, {
          type: 'image/webp',
        });
      }
      
      const newDoc = await apiService.documents.create({
        patientId: patient.id,
        uploaderId: user.id,
        title: newDocTitle,
        type: newDocType as any,
        description: newDocDescription,
        uploadDate: new Date().toISOString(),
      }, fileToUpload);
      
      setDocuments([newDoc, ...documents]);
      setNewDocTitle("");
      setSelectedFile(null);
      setNewDocDescription("");
      setUploadingDoc(false);
      alert("✅ Documento subido exitosamente");
    } catch (error) {
      console.error('Error uploading document:', error);
      alert("❌ Error al subir el documento");
    } finally {
      setSaving(false);
    }
  };

  // Función para manejar la selección de archivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo es muy grande. El tamaño máximo es 10MB.');
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) y PDF.');
      return;
    }

    setSelectedFile(file);
    if (!newDocTitle.trim()) {
      setNewDocTitle(file.name.split('.')[0]);
    }
  };

  // ==================== FUNCIONES PARA COMITÉ ONCOLÓGICO ====================
  const handleAddComiteFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('El archivo es muy grande. El tamaño máximo es 10MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) y PDF.');
      return;
    }

    setPendingComiteFile(file);
    setPendingComiteTitle('Comité Oncológico');
    setShowComiteTitleModal(true);
  };

  const handleAddComitePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('El archivo es muy grande. El tamaño máximo es 10MB.');
        return;
      }

      setPendingComiteFile(file);
      setPendingComiteTitle('Comité Oncológico');
      setShowComiteTitleModal(true);
    };
    
    input.click();
  };

  const confirmUploadComite = async () => {
    if (!pendingComiteFile || !pendingComiteTitle.trim()) {
      alert('Por favor ingresa un título para el documento.');
      return;
    }

    if (!user) {
      alert('Error: Faltan datos de usuario.');
      return;
    }

    setIsLoadingComite(true);
    try {
      const newDoc = await apiService.documents.create({
        title: pendingComiteTitle.trim(),
        type: 'informe_medico',
        patientId: patient.id,
        uploaderId: user.id,
        uploadDate: new Date().toISOString(),
        isComiteOncologico: true
      }, pendingComiteFile);

      setDocuments([newDoc, ...documents]);
      setPendingComiteFile(null);
      setPendingComiteTitle('Comité Oncológico');
      setShowComiteTitleModal(false);
      
      const fileInput = document.getElementById('comite-file-upload-editable') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      alert('✅ Documento del Comité Oncológico subido exitosamente. Puedes subir más archivos.');
    } catch (error) {
      console.error('Error al subir documento del Comité Oncológico:', error);
      alert('Error al subir el documento. Por favor intenta de nuevo.');
    } finally {
      setIsLoadingComite(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm("¿Estás seguro de eliminar este documento?")) return;

    try {
      setSaving(true);
      await apiService.documents.delete(docId);
      setDocuments(documents.filter(d => d.id !== docId));
      alert("✅ Documento eliminado exitosamente");
    } catch (error) {
      console.error('Error deleting document:', error);
      alert("❌ Error al eliminar el documento");
    } finally {
      setSaving(false);
    }
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
              Volver
            </Button>
            <div className="flex items-center justify-center space-x-3">
              <CancerRibbon className="text-[#ff6299]" size="lg" />
              <LogoUniversidad className="w-8 h-8" />
            </div>
          </div>

          {/* Patient Header */}
          <div className="flex items-start space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={patientPhoto?.url} alt={patient.name} />
              <AvatarFallback
                className="text-lg"
                style={{ backgroundColor: cancerColor.color + "40" }}
              >
                {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{patient.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span>{calculateAge(patient.dateOfBirth)} años</span>
                <span>RUT: {patient.rut}</span>
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Badge className="text-white border-0" style={{ backgroundColor: cancerColor.color }}>
                  {cancerColor.name}
                </Badge>
                <Badge variant="outline">{patient.diagnosis} - {patient.stage}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Critical Information Alert */}
        {patient.allergies.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ ALERGIAS:</strong> {patient.allergies.join(", ")}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
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
              {/* Current Medications - EDITABLE */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Pill className="w-5 h-5" style={{ color: cancerColor.color }} />
                      <span>Medicamentos Actuales</span>
                    </CardTitle>
                    {canEdit('currentMedications') && !editingMeds && (
                      <Button size="sm" variant="ghost" onClick={startEditingMeds}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingMeds ? (
                    <div className="space-y-3">
                      {tempMeds.map((med, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={med}
                            onChange={(e) => updateMed(index, e.target.value)}
                            placeholder="Nombre del medicamento"
                            className="flex-1"
                          />
                          <Button size="sm" variant="ghost" onClick={() => removeMed(index)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addMed} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Medicamento
                      </Button>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={saveMeds} disabled={saving} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingMeds}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : patient.currentMedications.length > 0 ? (
                    <ul className="space-y-2">
                      {patient.currentMedications.map((med, index) => (
                        <li key={index} className="text-sm bg-gray-50 p-3 rounded-lg flex items-start">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 mr-2"
                            style={{ backgroundColor: cancerColor.color }}
                          />
                          {med}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">Sin medicamentos registrados</p>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contacts - EDITABLE (Solo Doctor) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <span>Contactos de Emergencia</span>
                    </CardTitle>
                    {canEdit('emergencyContacts') && !editingContacts && (
                      <Button size="sm" variant="ghost" onClick={startEditingContacts}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingContacts ? (
                    <div className="space-y-3">
                      {tempContacts.map((contact, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-600">Contacto {index + 1}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeContact(index)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                          <Input
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            placeholder="Nombre"
                          />
                          <Input
                            value={contact.relationship}
                            onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                            placeholder="Relación (ej: Madre, Esposo)"
                          />
                          <Input
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            placeholder="Teléfono"
                          />
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={addContact} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Contacto
                      </Button>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={saveContacts} disabled={saving} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingContacts}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patient.emergencyContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-gray-600">{contact.relationship}</p>
                            <p className="text-xs text-gray-500 mt-1">{contact.phone}</p>
                          </div>
                          <Button size="sm" onClick={() => callEmergencyContact(contact.phone)} className="bg-green-600 hover:bg-green-700">
                            <Phone className="w-4 h-4 mr-1" />
                            Llamar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Allergies - EDITABLE (Solo Doctor) */}
              {(patient.allergies.length > 0 || canEdit('allergies')) && (
                <Card className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Alergias</span>
                      </CardTitle>
                      {canEdit('allergies') && !editingAllergies && (
                        <Button size="sm" variant="ghost" onClick={startEditingAllergies}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingAllergies ? (
                      <div className="space-y-3">
                        {tempAllergies.map((allergy, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={allergy}
                              onChange={(e) => updateAllergy(index, e.target.value)}
                              placeholder="Nombre de la alergia"
                              className="flex-1"
                            />
                            <Button size="sm" variant="ghost" onClick={() => removeAllergy(index)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={addAllergy} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Alergia
                        </Button>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={saveAllergies} disabled={saving} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingAllergies}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : patient.allergies.length > 0 ? (
                      <ul className="space-y-2">
                        {patient.allergies.map((allergy, index) => (
                          <li key={index} className="text-sm bg-red-50 p-3 rounded-lg text-red-800 font-medium">
                            ⚠️ {allergy}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">Sin alergias registradas</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Operations - EDITABLE (Solo Doctor) */}
              {(patient.operations.length > 0 || canEdit('operations')) && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Scissors className="w-5 h-5" style={{ color: cancerColor.color }} />
                        <span>Intervenciones Quirúrgicas</span>
                      </CardTitle>
                      {canEdit('operations') && !editingOperations && (
                        <Button size="sm" variant="ghost" onClick={startEditingOperations}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingOperations ? (
                      <div className="space-y-3">
                        {tempOperations.map((op, index) => (
                          <div key={index} className="p-3 border rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-gray-600">Operación {index + 1}</span>
                              <Button size="sm" variant="ghost" onClick={() => removeOperation(index)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                            <Input
                              value={op.procedure}
                              onChange={(e) => updateOperation(index, 'procedure', e.target.value)}
                              placeholder="Procedimiento"
                            />
                            <Input
                              type="date"
                              value={op.date}
                              onChange={(e) => updateOperation(index, 'date', e.target.value)}
                              placeholder="Fecha"
                            />
                            <Input
                              value={op.hospital}
                              onChange={(e) => updateOperation(index, 'hospital', e.target.value)}
                              placeholder="Hospital"
                            />
                          </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={addOperation} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Operación
                        </Button>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" onClick={saveOperations} disabled={saving} className="flex-1">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditingOperations}>
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : patient.operations.length > 0 ? (
                      <div className="space-y-3">
                        {patient.operations.map((operation, index) => (
                          <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: cancerColor.color }}>
                            <p className="font-medium text-sm">{operation.procedure}</p>
                            <p className="text-xs text-gray-600 mt-1">{formatDate(operation.date)}</p>
                            <p className="text-xs text-gray-500">{operation.hospital}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sin Intervenciones Quirúrgicas registradas</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Treatment Summary - EDITABLE */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" style={{ color: cancerColor.color }} />
                      <span>Estado del Tratamiento</span>
                    </CardTitle>
                    {canEdit('treatmentSummary') && !editingTreatment && (
                      <Button size="sm" variant="ghost" onClick={startEditingTreatment}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingTreatment ? (
                    <div className="space-y-3">
                      <Textarea
                        value={tempTreatment}
                        onChange={(e) => setTempTreatment(e.target.value)}
                        placeholder="Resumen del tratamiento"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveTreatment} disabled={saving} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditingTreatment}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700 mb-4">{patient.treatmentSummary}</p>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: cancerColor.color + "20" }}>
                        <p className="text-xs font-semibold mb-2 text-gray-600">
                          Diagnóstico: {patient.diagnosis} • {patient.stage}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: NOTAS MÉDICAS */}
          <TabsContent value="notes" className="space-y-4 mt-6">
            {/* Formulario para crear nueva nota */}
            {canCreateNote() && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Agregar Nueva Nota Médica</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {creatingNote ? (
                    <div className="space-y-3">
                      <Textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Escribe aquí la nota médica..."
                        rows={6}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Button onClick={createNote} disabled={saving} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Guardar Nota
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setCreatingNote(false);
                          setNewNoteContent("");
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setCreatingNote(true)} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Nota
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lista de notas existentes */}
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
                  <p className="text-gray-500 text-lg">No hay notas médicas registradas</p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => {
                const canEdit = canEditNote(note);
                const canDelete = canDeleteNote(note);
                
                return (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{note.authorName}</p>
                        <p className="text-xs text-gray-500">{formatDate(note.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <StickyNote className="w-3 h-3 mr-1" />
                          Nota Médica
                        </Badge>
                        {canEdit && editingNoteId !== note.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditingNote(note)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Editar nota"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNote(note.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar nota"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingNoteId === note.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editingNoteContent}
                          onChange={(e) => setEditingNoteContent(e.target.value)}
                          rows={6}
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEditedNote(note.id)}
                            disabled={saving}
                            className="flex-1"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditingNote}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    )}
                  </CardContent>
                </Card>
              )})
            )}
          </TabsContent>

          {/* TAB: DOCUMENTOS */}
          <TabsContent value="documents" className="space-y-4 mt-6">
            {/* Formulario para subir nuevo documento */}
            {canUploadDocument() && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Subir Nuevo Documento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {uploadingDoc ? (
                    <div className="space-y-3">
                      <Input
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="Título del documento"
                        className="bg-white"
                      />
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white"
                      >
                        <option value="examen">Examen</option>
                        <option value="cirugia">Cirugía</option>
                        <option value="quimioterapia">Quimioterapia</option>
                        <option value="radioterapia">Radioterapia</option>
                        <option value="receta">Receta</option>
                        <option value="informe_medico">Informe Médico</option>
                        <option value="consentimiento">Consentimiento</option>
                        <option value="otro">Otro</option>
                      </select>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Archivo</label>
                        <input
                          type="file"
                          id="file-upload-record"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('file-upload-record')?.click()}
                          type="button"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {selectedFile ? `📁 ${selectedFile.name}` : 'Seleccionar archivo'}
                        </Button>
                        {selectedFile && (
                          <p className="text-xs text-gray-500">
                            Tamaño: {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Textarea
                        value={newDocDescription}
                        onChange={(e) => setNewDocDescription(e.target.value)}
                        placeholder="Descripción (opcional)"
                        rows={2}
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={uploadDocument} 
                          disabled={saving || !selectedFile} 
                          className="flex-1"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Subiendo...' : 'Guardar Documento'}
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setUploadingDoc(false);
                          setNewDocTitle("");
                          setSelectedFile(null);
                          setNewDocDescription("");
                        }}>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setUploadingDoc(true)} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Subir Documento
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Sección del Comité Oncológico con botones de subida */}
            {canUploadDocument() && (
              <Card className="bg-purple-50 border-purple-300 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-purple-900">Comité Oncológico</h3>
                    <span className="text-sm text-purple-700 font-medium">
                      {documents.filter(d => d.isComiteOncologico === true).length}{' '}
                      {documents.filter(d => d.isComiteOncologico === true).length === 1 ? 'documento' : 'documentos'}
                    </span>
                  </div>
                  
                  <div className="flex gap-3 mb-4">
                    <input
                      type="file"
                      id="comite-file-upload-editable"
                      accept="image/*,.pdf"
                      onChange={handleAddComiteFile}
                      className="hidden"
                      disabled={isLoadingComite}
                    />
                    <Button
                      variant="default"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => document.getElementById('comite-file-upload-editable')?.click()}
                      disabled={isLoadingComite}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Archivo
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleAddComitePhoto}
                      disabled={isLoadingComite}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Tomar Foto
                    </Button>
                  </div>

                  {documents.filter(d => d.isComiteOncologico === true).length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="w-12 h-12 mx-auto text-purple-400 mb-2" />
                      <p className="text-purple-700 font-medium">Sin documentos del comité aún</p>
                      <p className="text-purple-600 text-sm mt-1">Puedes subir múltiples archivos usando los botones de arriba</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documents
                        .filter(d => d.isComiteOncologico === true)
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
                              <div className="flex gap-2 ml-4">
                                <Button
                                  variant="default"
                                  onClick={() => downloadDocument(doc.id)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Abrir
                                </Button>
                                {canDeleteDocument(doc) && (
                                  <Button
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                    onClick={() => deleteDocument(doc.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lista de documentos existentes (solo otros documentos, NO del comité) */}
            {loadingDocuments ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Cargando documentos...</p>
                </CardContent>
              </Card>
            ) : documents.filter(d => d.isComiteOncologico !== true).length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No hay otros documentos registrados</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Otros Documentos</h3>
                {/* Resto de documentos en grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {displayDocuments
                    .filter(doc => doc.isComiteOncologico !== true)
                    .map((doc) => (
                      <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{doc.title}</CardTitle>
                              <p className="text-xs text-gray-500 mt-1">{formatDate(doc.uploadDate)}</p>
                              {doc.description && (
                                <p className="text-xs text-gray-600 mt-2">{doc.description}</p>
                              )}
                            </div>
                            <Badge style={{ backgroundColor: getDocumentBadgeColor(doc.type) }} className="text-white">
                              {doc.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full" onClick={() => downloadDocument(doc.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            Abrir
                          </Button>
                          {canDeleteDocument(doc) && (
                            <Button
                              variant="outline"
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => deleteDocument(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </Button>
                          )}
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
                  <User className="w-5 h-5" style={{ color: cancerColor.color }} />
                  <span>Equipo de Cuidados</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {patient.careTeam.map((member, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: cancerColor.color }}
                      >
                        {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-gray-600">{getRoleName(member.role)}</p>
                      </div>
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                </div>

                {/* Manage Care Team */}
                {isStaff && <ManageCareTeam patient={patient} onUpdate={() => window.location.reload()} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Patient ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" style={{ color: cancerColor.color }} />
              <span>Información de Ficha</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">ID de Ficha Médica</p>
              <p className="font-mono font-medium text-lg mt-1">{patient.qrCode}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-20" />

      {/* Modal para título del Comité Oncológico */}
      <Dialog open={showComiteTitleModal} onOpenChange={setShowComiteTitleModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Título del documento</DialogTitle>
            <DialogDescription>
              Ingresa un nombre para identificar este documento del Comité Oncológico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="comite-title-editable">Título del documento</Label>
              <Input
                id="comite-title-editable"
                placeholder="Ej: Informe Comité Oncológico 12/10"
                value={pendingComiteTitle}
                onChange={(e) => setPendingComiteTitle(e.target.value)}
                disabled={isLoadingComite}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowComiteTitleModal(false);
                  setPendingComiteFile(null);
                  setPendingComiteTitle('Comité Oncológico');
                }}
                disabled={isLoadingComite}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmUploadComite}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isLoadingComite || !pendingComiteTitle.trim()}
              >
                {isLoadingComite ? 'Subiendo...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
