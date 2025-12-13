import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import type { DoctorUser, NurseUser } from '@/types/medical';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { optimizeProfilePicture, getReadableFileSize } from '@/common/helpers/ImageOptimizer';
import { 
  User, 
  Stethoscope, 
  Edit3, 
  Save, 
  X,
  LogOut
} from 'lucide-react';

export function EditableClinicalProfile() {
  const { user, logout, refreshUser } = useAuth();
  const [userPhoto, setUserPhoto] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de edición
  const [editingSpecialization, setEditingSpecialization] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(false);
  const [editingLicense, setEditingLicense] = useState(false);

  // Estados temporales
  const [tempSpecialization, setTempSpecialization] = useState('');
  const [tempDepartment, setTempDepartment] = useState('');
  const [tempLicense, setTempLicense] = useState('');

  const isDoctor = user?.role === 'doctor';
  const isNurse = user?.role === 'nurse';
  const accentColor = isDoctor ? '#001663' : '#00B4D8';

  // Cargar foto de perfil
  useEffect(() => {
    const loadUserPhoto = async () => {
      if (user?.id) {
        try {
          const photoData = await apiService.users.getProfilePicture(user.id);
          setUserPhoto(photoData);
        } catch (error) {
          console.log('No profile picture found');
        }
      }
    };
    loadUserPhoto();
  }, [user?.id]);

  // Guardar campo
  const saveField = async (field: string, value: any) => {
    if (!user) return false;
    try {
      setSaving(true);
      await apiService.users.update(user.id, { [field]: value });
      
      // Actualizar el usuario en el contexto sin recargar la página
      await refreshUser();
      
      alert('✅ Cambios guardados correctamente');
      return true;
    } catch (error) {
      console.error('Error saving field:', error);
      alert('❌ Error al guardar. Intenta nuevamente.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ==== ESPECIALIZACIÓN (Doctor) ====
  const startEditingSpecialization = () => {
    if (!user || !isDoctor) return;
    setTempSpecialization((user as DoctorUser).specialization || '');
    setEditingSpecialization(true);
  };

  const saveSpecialization = async () => {
    if (await saveField('specialization', tempSpecialization)) {
      setEditingSpecialization(false);
    }
  };

  // ==== DEPARTAMENTO (Nurse) ====
  const startEditingDepartment = () => {
    if (!user || !isNurse) return;
    setTempDepartment((user as NurseUser).department || '');
    setEditingDepartment(true);
  };

  const saveDepartment = async () => {
    if (await saveField('department', tempDepartment)) {
      setEditingDepartment(false);
    }
  };

  // ==== LICENCIA ====
  const startEditingLicense = () => {
    if (!user) return;
    const clinicalUser = user as DoctorUser | NurseUser;
    setTempLicense(clinicalUser.license || '');
    setEditingLicense(true);
  };

  const saveLicense = async () => {
    if (await saveField('license', tempLicense)) {
      setEditingLicense(false);
    }
  };

  // ==== FOTO DE PERFIL ====
  const handleCropComplete = async (croppedImageBlob: Blob) => {
    if (!user) return;

    try {
      setSaving(true);
      
      console.log(`📸 Imagen original: ${getReadableFileSize(croppedImageBlob.size)}`);
      const optimizedBlob = await optimizeProfilePicture(croppedImageBlob);
      console.log(`✨ Imagen optimizada: ${getReadableFileSize(optimizedBlob.size)}`);
      
      const optimizedFile = new File([optimizedBlob], 'profile-picture.webp', {
        type: 'image/webp',
      });

      const result = await apiService.users.uploadProfilePicture(user.id, optimizedFile);
      setUserPhoto(result);
      alert('✅ Foto de perfil actualizada correctamente');
      
      setSelectedImageSrc(null);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('❌ Error al subir la foto. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  const clinicalUser = user as DoctorUser | NurseUser;
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">Información profesional y datos personales</p>
        </div>

        {/* Datos Personales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" style={{ color: accentColor }} />
              <span>Datos Personales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:space-x-6 space-y-6 md:space-y-0">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-2 w-full md:w-auto">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={userPhoto?.url} alt={user?.name} />
                  <AvatarFallback className="text-lg" style={{ backgroundColor: accentColor + '40', color: accentColor }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Cambiar Foto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    e.target.value = '';
                    const imageUrl = URL.createObjectURL(file);
                    setSelectedImageSrc(imageUrl);
                    setCropDialogOpen(true);
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4 w-full">
                {/* Nombre */}
                <div>
                  <Label className="text-sm text-gray-600">Nombre completo</Label>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>

                {/* Email */}
                <div>
                  <Label className="text-sm text-gray-600">Email</Label>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>

                {/* RUT */}
                <div>
                  <Label className="text-sm text-gray-600">RUT</Label>
                  <p className="font-medium text-gray-900">{user.rut}</p>
                </div>

                {/* Rol */}
                <div>
                  <Label className="text-sm text-gray-600">Rol</Label>
                  <p className="font-medium text-gray-900 capitalize">
                    {isDoctor ? 'Médico/Médica' : 'Enfermera'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5" style={{ color: accentColor }} />
              <span>Información Profesional</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Especialización (Solo para doctores) */}
            {isDoctor && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm text-gray-600">Especialización</Label>
                  {!editingSpecialization && (
                    <Button size="sm" variant="ghost" onClick={startEditingSpecialization}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {editingSpecialization ? (
                  <div className="space-y-2">
                    <Input
                      value={tempSpecialization}
                      onChange={(e) => setTempSpecialization(e.target.value)}
                      placeholder="Ej: Oncología, Cirugía Oncológica"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveSpecialization} disabled={saving}>
                        <Save className="w-3 h-3 mr-1" />
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingSpecialization(false)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">
                    {(clinicalUser as DoctorUser).specialization || 'No especificada'}
                  </p>
                )}
              </div>
            )}

            {/* Departamento (Solo para enfermeras) */}
            {isNurse && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm text-gray-600">Departamento</Label>
                  {!editingDepartment && (
                    <Button size="sm" variant="ghost" onClick={startEditingDepartment}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {editingDepartment ? (
                  <div className="space-y-2">
                    <Input
                      value={tempDepartment}
                      onChange={(e) => setTempDepartment(e.target.value)}
                      placeholder="Ej: Oncología, Cuidados Intensivos"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveDepartment} disabled={saving}>
                        <Save className="w-3 h-3 mr-1" />
                        Guardar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setEditingDepartment(false)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium text-gray-900">
                    {(clinicalUser as NurseUser).department || 'No especificado'}
                  </p>
                )}
              </div>
            )}

            {/* Licencia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm text-gray-600">Número de Licencia</Label>
                {!editingLicense && (
                  <Button size="sm" variant="ghost" onClick={startEditingLicense}>
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              {editingLicense ? (
                <div className="space-y-2">
                  <Input
                    value={tempLicense}
                    onChange={(e) => setTempLicense(e.target.value)}
                    placeholder="Ej: MED-12345"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveLicense} disabled={saving}>
                      <Save className="w-3 h-3 mr-1" />
                      Guardar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingLicense(false)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="font-medium text-gray-900">
                  {clinicalUser.license || 'No especificada'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botón Cerrar Sesión */}
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de recorte de imagen */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={selectedImageSrc}
        onCropComplete={handleCropComplete}
        aspect={1}
      />
    </div>
  );
}
