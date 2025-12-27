
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
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-2xl border border-dashed border-slate-300">
        <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>
        <p className="text-slate-400">Sin registros</p>
      </div>
    );
  }

  const sortedEntries = [...weightEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {sortedEntries.map((entry) => (
        <div key={entry.date} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
              {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
            <p className="text-xl font-black text-indigo-900">
              {entry.weight.toFixed(1)} <span className="text-sm font-normal text-slate-400">kg</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEditRequest(entry)}
              className="p-2 text-indigo-600 bg-indigo-50 rounded-lg active:bg-indigo-100"
              aria-label="Editar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              onClick={() => onDelete(entry.date)}
              className="p-2 text-red-600 bg-red-50 rounded-lg active:bg-red-100"
              aria-label="Eliminar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
