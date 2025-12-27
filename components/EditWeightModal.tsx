
import React, { useState, useEffect } from 'react';
import { WeightEntry } from '../types';

interface EditWeightModalProps {
  entry: WeightEntry;
  onSave: (date: string, weight: number) => void;
  onClose: () => void;
}

export const EditWeightModal: React.FC<EditWeightModalProps> = ({ entry, onSave, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<string>(entry.date);
  const [weight, setWeight] = useState<string>(entry.weight.toString());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedDate(entry.date);
    setWeight(entry.weight.toString());
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedWeight = parseFloat(weight.replace(',', '.'));

    if (!selectedDate) {
      setError('Selecciona una fecha.');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Introduce un peso válido.');
      return;
    }

    onSave(selectedDate, parsedWeight);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-indigo-800">
            Editar Registro
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 p-2"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="edit-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base bg-blue-50"
            />
          </div>
          <div>
            <label htmlFor="edit-weight" className="block text-sm font-medium text-gray-700 mb-2">
              Peso (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="edit-weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base bg-blue-50"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-8">
            <button
              type="submit"
              className="w-full py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 px-4 border border-gray-300 rounded-xl shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
