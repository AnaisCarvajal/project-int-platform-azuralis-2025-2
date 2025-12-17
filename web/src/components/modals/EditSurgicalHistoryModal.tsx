import { useState } from "react";
import { X, Plus, Trash2, Scissors, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import type { Operation } from "@/types/medical";

interface EditSurgicalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  currentHistory: Operation[];
  onSave: (history: Operation[]) => void;
}

export function EditSurgicalHistoryModal({
  isOpen,
  onClose,
  patientId,
  currentHistory,
  onSave,
}: EditSurgicalHistoryModalProps) {
  const [history, setHistory] = useState<Operation[]>(currentHistory || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newIntervention, setNewIntervention] = useState<Operation>({
    type: "",
    date: "",
    hospital: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleAddIntervention = () => {
    if (newIntervention.type.trim() && newIntervention.date) {
      setHistory([...history, { ...newIntervention }]);
      setNewIntervention({ type: "", date: "", hospital: "", notes: "" });
      setShowForm(false);
    }
  };

  const handleRemoveIntervention = (index: number) => {
    setHistory(history.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await apiService.patients.update(patientId, {
        operations: history,
      });
      onSave(history);
      onClose();
    } catch (err: any) {
      console.error("Error al guardar historial quirúrgico:", err);
      setError(err?.response?.data?.message || "Error al guardar el historial");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-purple-50">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Historial Quirúrgico
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-purple-100 rounded-full transition-colors"
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

          {/* Formulario nueva intervención */}
          {showForm ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <input
                type="text"
                value={newIntervention.type}
                onChange={(e) =>
                  setNewIntervention({ ...newIntervention, type: e.target.value })
                }
                placeholder="Tipo de procedimiento *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="date"
                value={newIntervention.date}
                onChange={(e) =>
                  setNewIntervention({ ...newIntervention, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                value={newIntervention.hospital || ""}
                onChange={(e) =>
                  setNewIntervention({ ...newIntervention, hospital: e.target.value })
                }
                placeholder="Hospital (opcional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                value={newIntervention.notes || ""}
                onChange={(e) =>
                  setNewIntervention({ ...newIntervention, notes: e.target.value })
                }
                placeholder="Notas (opcional)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddIntervention}
                  disabled={!newIntervention.type.trim() || !newIntervention.date}
                  className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                >
                  Agregar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Intervención
            </button>
          )}

          {/* Lista de intervenciones */}
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No hay intervenciones registradas
              </p>
            ) : (
              history.map((intervention, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {intervention.type}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(intervention.date).toLocaleDateString("es-CL")}
                        {intervention.hospital && ` • ${intervention.hospital}`}
                      </p>
                      {intervention.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {intervention.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveIntervention(index)}
                      className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
