
import React, { useRef, useState } from 'react';
import { importWeightEntries } from '../services/localStorageService';
import { WeightEntry } from '../types';

interface DataManagementProps {
  onDataChanged: () => void;
  onError: (msg: string) => void;
  onExport: () => void | Promise<void>;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onDataChanged, onError, onExport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportClick = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      await onExport();
      setExportSuccess(true);
      setIsExporting(false);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error("Error en exportación:", err);
      onError("No se pudo completar la exportación.");
      setIsExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let importedData: WeightEntry[] = [];

        // Detectar si es JSON o CSV
        if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
          // Es JSON
          const parsed = JSON.parse(content);
          if (!Array.isArray(parsed)) throw new Error("Formato JSON inválido.");
          importedData = parsed;
        } else {
          // Intentar parsear como CSV
          const lines = content.split(/\r?\n/);
          // Omitir cabecera si existe
          const startIdx = (lines[0].toLowerCase().includes('fecha') || lines[0].toLowerCase().includes('date')) ? 1 : 0;
          
          importedData = lines.slice(startIdx)
            .filter(line => line.trim() !== '')
            .map(line => {
              const parts = line.split(',');
              if (parts.length < 2) return null;
              const date = parts[0].trim();
              const weight = parseFloat(parts[1].trim());
              if (!date || isNaN(weight)) return null;
              return { date, weight };
            })
            .filter((entry): entry is WeightEntry => entry !== null);
            
          if (importedData.length === 0) throw new Error("No se encontraron registros válidos en el CSV.");
        }

        importWeightEntries(importedData);
        onDataChanged();
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert("¡Datos importados con éxito!");
      } catch (err) {
        console.error("Error al importar:", err);
        onError("El archivo seleccionado no es un respaldo válido (.json o .csv).");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExportClick}
          disabled={isExporting}
          className={`flex flex-col items-center justify-center p-4 border border-indigo-100 bg-indigo-50 rounded-xl text-indigo-700 active:scale-95 transition-transform hover:bg-indigo-100 ${isExporting && !exportSuccess ? 'opacity-50' : ''}`}
        >
          {isExporting && !exportSuccess ? (
            <div className="w-6 h-6 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin mb-1"></div>
          ) : (
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          )}
          <span className="text-sm font-bold">Exportar CSV</span>
        </button>
        
        <button
          onClick={handleImportClick}
          className="flex flex-col items-center justify-center p-4 border border-slate-200 bg-white rounded-xl text-slate-700 active:scale-95 transition-transform hover:bg-slate-50"
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          <span className="text-sm font-bold">Importar</span>
        </button>
      </div>

      {exportSuccess && (
        <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <div>
              <p className="font-bold text-sm">Copia gestionada</p>
              <p className="text-[10px] opacity-90 leading-tight">
                Se ha generado el archivo .csv y se ha abierto el menú de compartir.
              </p>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json,.csv" 
        className="hidden" 
      />
    </div>
  );
};
