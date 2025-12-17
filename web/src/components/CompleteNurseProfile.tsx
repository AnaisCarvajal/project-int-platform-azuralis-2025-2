import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';
import { Stethoscope, Loader2 } from 'lucide-react';

interface CompleteNurseProfileProps {
  onComplete: () => void;
}

export const CompleteNurseProfile = ({ onComplete }: CompleteNurseProfileProps) => {
  const { user, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    department: '',
    license: '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.department.trim() || !formData.license.trim()) {
      setError('Por favor, completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      console.log('ID de Usuario a actualizar:', user.id);
      console.log('Datos a enviar:', formData);

      // Actualizar perfil del usuario con los datos de enfermera
      await apiService.users.update(user.id, {
        department: formData.department.trim(),
        license: formData.license.trim(),
      });

      // Refrescar el usuario en el contexto
      await refreshUser();
      
      // Notificar éxito
      onComplete();
    } catch (err: any) {
      console.error('Error al completar perfil:', err);
      setError(err.response?.data?.message || 'Error al actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50 p-4">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header Card */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-6 w-6 text-cyan-600" />
              <CardTitle className="text-lg font-semibold text-sky-900">
                Completa tu Perfil de Enfermera/o
              </CardTitle>
            </div>
            <CardDescription className="text-slate-600 text-sm">
              Por favor, proporciona la siguiente información profesional para activar tu cuenta.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Form Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="department" className="text-sm font-medium text-gray-900">
                  Departamento <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Ej: Oncología, Cuidados Intensivos, Pediatría"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="license" className="text-sm font-medium text-gray-900">
                  Número de Licencia Profesional <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="license"
                  type="text"
                  placeholder="Ej: RN-12345"
                  value={formData.license}
                  onChange={(e) => handleChange('license', e.target.value)}
                  className="bg-gray-50 border-gray-300"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-5 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Completar Perfil'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-sky-100 border border-sky-300">
          <CardContent className="pt-4 pb-4 text-center">
            <h4 className="text-sm font-semibold text-slate-800 mb-1">
              Información Profesional
            </h4>
            <p className="text-xs text-slate-600">
              Estos datos serán visibles para los pacientes y te identificarán como profesional
              de enfermería certificado en la plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
