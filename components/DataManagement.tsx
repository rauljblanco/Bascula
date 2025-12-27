
import React, { useRef } from 'react';
import { getWeightEntries, importWeightEntries } from '../services/localStorageService';

interface DataManagementProps {
  onDataChanged: () => void;
  onError: (msg: string) => void;
  onExport?: () => void; // Añadimos esta línea
}

export const DataManagement: React.FC<DataManagementProps> = ({ onDataChanged, onError, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportInternal = () => {
    // Si desde App.tsx nos pasan la función de exportación móvil (onExport), la usamos.
    if (onExport) {
      onExport();
      return;
    }

    // Si no (fallback), usamos el método antiguo que funciona en PC
    const entries = getWeightEntries();
    if (entries.length === 0) {
      onError("No hay datos para exportar.");
      return;
    }
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pesos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        if (!Array.isArray(importedData)) throw new Error("Formato inválido.");
        importWeightEntries(importedData);
        onDataChanged();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        onError("Error al importar el archivo.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportInternal}
          className="flex flex-col items-center justify-center p-4 border border-indigo-100 bg-indigo-50 rounded-xl text-indigo-700 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-sm font-bold">Exportar</span>
        </button>
        
        <button
          onClick={handleImportClick}
          className="flex flex-col items-center justify-center p-4 border border-slate-200 bg-white rounded-xl text-slate-700 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-bold">Importar</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
