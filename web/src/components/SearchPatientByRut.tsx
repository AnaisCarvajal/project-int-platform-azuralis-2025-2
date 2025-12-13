import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserSearch, AlertCircle, Clock } from 'lucide-react';
import type { Patient, DoctorUser, NurseUser, SearchRecord } from '@/types/medical';
import { validateRUT } from '@/common/helpers/ValidateForm';

interface SearchPatientByRutProps {
  onPatientFound: (patient: Patient) => void;
  onBack: () => void;
}

export function SearchPatientByRut({ onPatientFound, onBack }: SearchPatientByRutProps) {
  const [rut, setRut] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchRecord[]>([]);
  const { user } = useAuth();

  // Cargar historial UNIFICADO (QR móvil + búsqueda web) al montar el componente
  useEffect(() => {
    console.log('🔍 SearchPatientByRut - Usuario actual:', user);
    
    if (user && (user.role === 'doctor' || user.role === 'nurse')) {
      const clinicalUser = user as DoctorUser | NurseUser;
      const history = clinicalUser.searchHistory;
      
      console.log('📋 Historial encontrado:', history);
      
      if (history && history.length > 0) {
        // Ordenar por fecha más reciente primero y tomar solo los últimos 5
        const sortedHistory = [...history]
          .sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime())
          .slice(0, 5);
        
        console.log('✅ Historial ordenado:', sortedHistory);
        
        // Cargar nombres de pacientes para cada registro del historial
        Promise.all(
          sortedHistory.map(async (record) => {
            try {
              const name = await apiService.patients.getName(record.patientId);
              // For now, patients don't have profile pictures, so we use null
              return { ...record, patientName: name, patientPhoto: null };
            } catch (error) {
              console.error(`Error cargando nombre para paciente ${record.patientId}:`, error);
              // Si no se puede cargar el nombre, usar el RUT como fallback
              return { ...record, patientName: `Paciente (${record.patientRut})`, patientPhoto: null };
            }
          })
        ).then((historyWithNames) => {
          setSearchHistory(historyWithNames);
        });
      } else {
        console.log('⚠️ No hay historial disponible');
      }
    }
  }, [user]);

  const handleSearchFromHistory = async (historyItem: SearchRecord) => {
    setLoading(true);
    setError('');
    
    try {
      // Buscar por RUT en lugar de por ID, ya que el RUT es más confiable
      const patient = await apiService.patients.findByRut(historyItem.patientRut);
      onPatientFound(patient);
    } catch (err: any) {
      console.error('Error al cargar paciente del historial:', err);
      setError('Error al cargar el paciente. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      return `Hace ${diffInMins} minuto${diffInMins !== 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    } else {
      return dateObj.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar RUT antes de buscar
    if (!rut.trim()) {
      setError('Por favor ingresa un RUT');
      return;
    }

    // Validar formato del RUT
    if (!validateRUT(rut)) {
      setError('El RUT ingresado no es válido');
      return;
    }

    setLoading(true);

    try {
      // Buscar paciente por RUT usando el endpoint específico
      const patient = await apiService.patients.findByRut(rut);

      // Guardar en historial de búsquedas si es doctor o nurse
      if (user && (user.role === 'doctor' || user.role === 'nurse')) {
        try {
          await apiService.users.addSearchHistory(user.id, patient.id, patient.rut);
        } catch (err) {
          console.error('Error al guardar historial de búsqueda:', err);
          // No mostrar error al usuario, es un error secundario
        }
      }

      // Paciente encontrado - notificar al componente padre
      onPatientFound(patient);
    } catch (err: any) {
      console.error('Error al buscar paciente:', err);
      if (err.response?.status === 404) {
        setError('No se encontró ningún paciente con ese RUT');
      } else {
        setError(err.response?.data?.message || 'Error al buscar paciente. Por favor intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Volver</span>
          </Button>
        </div>

        {/* Tarjeta de búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserSearch className="w-6 h-6 text-blue-600" />
              <span>Buscar por RUT</span>
            </CardTitle>
              <p className='text-sm text-gray-600'>Ingresa el RUT con guión. Los puntos son opcionales.</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <div className="flex space-x-2">
                  <Input
                    id="rut"
                    type="text"
                    value={rut}
                    onChange={(e) => {
                      setRut(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="11.222.333-4 o 11111111-2"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={loading || !rut.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Buscando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Buscar</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>

              {/* Mensaje de error */}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 text-sm ml-2">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Historial de Búsquedas (QR móvil + búsqueda web UNIFICADO) */}
        {searchHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-gray-600" />
                <span>Búsquedas Recientes</span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <button
                    key={`${item.patientId}-${index}`}
                    onClick={() => handleSearchFromHistory(item)}
                    disabled={loading}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left border border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={item.patientPhoto?.url} alt={item.patientName} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                            {item.patientName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'NN'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.patientName || 'Cargando...'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.patientRut}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.searchedAt)}
                          </p>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Información adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Acceso Rápido</h3>
                <p className="text-sm text-blue-800">
                  Una vez encontrado el paciente, podrás ver y editar su ficha médica completa,
                  agregar notas clínicas y subir documentos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Espacio para el Bottom Navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}
