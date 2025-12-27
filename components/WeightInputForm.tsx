
import React, { useState } from 'react';

interface WeightInputFormProps {
  onAddWeight: (date: string, weight: number) => void;
}

export const WeightInputForm: React.FC<WeightInputFormProps> = ({ onAddWeight }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedWeight = parseFloat(weight.replace(',', '.'));

    if (!selectedDate) {
      setError('Por favor, selecciona una fecha.');
      return;
    }
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      setError('Por favor, introduce un peso válido.');
      return;
    }

    onAddWeight(selectedDate, parsedWeight);
    setWeight(''); 
    setSuccess('¡Registro guardado con éxito!');
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Fecha
        </label>
        <input
          type="date"
          id="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base bg-blue-50"
          aria-label="Seleccionar fecha"
        />
      </div>
      <div>
        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
          Peso (kg)
        </label>
        <input
          type="text"
          inputMode="decimal"
          id="weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="ej., 70.5"
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base bg-blue-50"
          aria-label="Introducir peso"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm font-medium" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-green-600 text-sm font-medium" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        className="w-full inline-flex justify-center items-center py-4 px-4 border border-transparent shadow-md text-base font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-95"
      >
        Añadir Peso
      </button>
    </form>
  );
};
