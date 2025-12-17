import { useState } from "react";
import { X, Plus, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";

interface EditAllergiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  currentAllergies: string[];
  onSave: (allergies: string[]) => void;
}

export function EditAllergiesModal({
  isOpen,
  onClose,
  patientId,
  currentAllergies,
  onSave,
}: EditAllergiesModalProps) {
  const [allergies, setAllergies] = useState<string[]>(currentAllergies || []);
  const [newAllergy, setNewAllergy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.patients.update(patientId, {
        allergies: allergies,
      });
      onSave(allergies);
      onClose();
    } catch (err: any) {
      console.error("Error al guardar alergias:", err);
      setError(err?.response?.data?.message || "Error al guardar las alergias");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">Editar Alergias</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Input para nueva alergia */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddAllergy()}
              placeholder="Agregar nueva alergia..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <button
              onClick={handleAddAllergy}
              disabled={!newAllergy.trim()}
              className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de alergias */}
          <div className="space-y-2">
            {allergies.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay alergias registradas
              </p>
            ) : (
              allergies.map((allergy, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                >
                  <span className="text-gray-800">{allergy}</span>
                  <button
                    onClick={() => handleRemoveAllergy(index)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
