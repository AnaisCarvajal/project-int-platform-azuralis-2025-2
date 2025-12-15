import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiService } from '@/services/api';
import type { CareTeamMember, Patient, ProfessionalSearchResult } from '@/types/medical';
import { UserPlus, UserMinus, Users, AlertCircle, Search } from 'lucide-react';

interface ManageCareTeamProps {
  patient: Patient;
  onUpdate: () => void;
}

export function ManageCareTeam({ patient, onUpdate }: ManageCareTeamProps) {
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfessionalSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalSearchResult | null>(null);

  // Form state
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    loadCareTeam();
  }, [patient.id]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchProfessionals(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCareTeam = async () => {
    try {
      const team = await apiService.careTeam.getByPatient(patient.id);
      setCareTeam(team.filter(m => m.status === 'active'));
    } catch (err) {
      console.error('Error al cargar equipo:', err);
    }
  };

  const searchProfessionals = async (query: string) => {
    setSearching(true);
    try {
      const results = await apiService.users.search(query);
      // Filtrar solo doctores y enfermeras
      const filtered = results.filter(u => u.role === 'doctor' || u.role === 'nurse');
      setSearchResults(filtered);
    } catch (err) {
      console.error('Error buscando profesionales:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProfessional = (professional: ProfessionalSearchResult) => {
    setSelectedProfessional(professional);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProfessional || !selectedRole) {
      setError('Debes seleccionar un profesional y un rol');
      return;
    }

    // Verificar si ya está en el equipo
    const alreadyInTeam = careTeam.some(m => m.userId === selectedProfessional.id);
    if (alreadyInTeam) {
      setError('Este profesional ya está en el equipo de cuidados');
      return;
    }

    setLoading(true);
    try {
      await apiService.careTeam.addToPatient(
        patient.id,
        selectedProfessional.id,
        selectedProfessional.name,
        selectedRole
      );

      setSuccess('Miembro agregado exitosamente');
      setSelectedProfessional(null);
      setSelectedRole('');
      setShowAddForm(false);
      await loadCareTeam();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al agregar miembro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('¿Estás seguro de remover este miembro del equipo?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.careTeam.removeFromPatient(patient.id, userId);
      setSuccess('Miembro removido exitosamente');
      await loadCareTeam();
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al remover miembro');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      oncologo_principal: 'Oncólogo Principal',
      cirujano: 'Cirujano',
      radiologo: 'Radiólogo',
      enfermera_jefe: 'Enfermera Jefe',
      consultor: 'Consultor',
    };
    return labels[role] || role;
  };

  const getUserRoleLabel = (role: string) => {
    return role === 'doctor' ? 'Médico' : role === 'nurse' ? 'Enfermero/a' : role;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Equipo de Cuidados</span>
          </CardTitle>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setSelectedProfessional(null);
              setSelectedRole('');
              setSearchQuery('');
              setSearchResults([]);
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Agregar Miembro
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mensajes */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800 text-sm">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario para agregar miembro */}
        {showAddForm && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <form onSubmit={handleAddMember} className="space-y-3">
                {/* Buscador de profesionales */}
                <div className="relative">
                  <Label htmlFor="search">Buscar Profesional (RUT, nombre o email)</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ej: 12.345.678-9 o Juan Pérez"
                      className="pl-10"
                      disabled={!!selectedProfessional}
                    />
                  </div>
                  
                  {/* Resultados de búsqueda */}
                  {searchResults.length > 0 && !selectedProfessional && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((professional) => (
                        <button
                          key={professional.id}
                          type="button"
                          onClick={() => handleSelectProfessional(professional)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                        >
                          <p className="font-medium text-gray-900">{professional.name}</p>
                          <p className="text-sm text-gray-500">
                            {professional.rut} • {getUserRoleLabel(professional.role)} • {professional.email}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {searching && (
                    <p className="text-sm text-gray-500 mt-1">Buscando...</p>
                  )}

                  {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                    <p className="text-sm text-gray-500 mt-1">No se encontraron profesionales</p>
                  )}
                </div>

                {/* Profesional seleccionado */}
                {selectedProfessional && (
                  <div className="p-3 bg-white rounded-md border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{selectedProfessional.name}</p>
                        <p className="text-sm text-gray-500">
                          {selectedProfessional.rut} • {getUserRoleLabel(selectedProfessional.role)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProfessional(null)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="role">Rol en el Equipo</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oncologo_principal">
                        Oncólogo Principal
                      </SelectItem>
                      <SelectItem value="cirujano">Cirujano</SelectItem>
                      <SelectItem value="radiologo">Radiólogo</SelectItem>
                      <SelectItem value="enfermera_jefe">
                        Enfermera Jefe
                      </SelectItem>
                      <SelectItem value="consultor">Consultor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={loading || !selectedProfessional || !selectedRole}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Agregando...' : 'Agregar'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedProfessional(null);
                      setSelectedRole('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de miembros */}
        <div className="space-y-2">
          {careTeam.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No hay miembros en el equipo de cuidados
            </p>
          ) : (
            careTeam.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">
                    {getRoleLabel(member.role)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Asignado: {new Date(member.assignedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveMember(member.userId)}
                  disabled={loading}
                  className="text-red-600 hover:bg-red-50"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}