import React from 'react';
import { WeightEntry } from '../types';

interface WeightEntryListProps {
  weightEntries: WeightEntry[];
  onEditRequest: (entry: WeightEntry) => void;
  onDelete: (date: string) => void;
}

export const WeightEntryList: React.FC<WeightEntryListProps> = ({ weightEntries, onEditRequest, onDelete }) => {
  if (weightEntries.length === 0) {
    return (
      <div className="flex justify-center items-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-lg">No hay registros aún. ¡Añade tu primer peso!</p>
      </div>
    );
  }

  // Ordenar por fecha descendente para mostrar los más recientes arriba
  const sortedEntries = [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Peso
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedEntries.map((entry) => (
            <tr key={entry.date} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {new Date(entry.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                {entry.weight.toFixed(1)} kg
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEditRequest(entry)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4 p-2 rounded-md hover:bg-indigo-50 transition-colors duration-200"
                  aria-label={`Editar registro del ${entry.date}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(entry.date)}
                  className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                  aria-label={`Eliminar registro del ${entry.date}`}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};