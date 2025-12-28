
import React, { useRef, useState } from 'react';
import { getWeightEntries, importWeightEntries } from '../services/localStorageService';

interface DataManagementProps {
  onDataChanged: () => void;
  onError: (msg: string) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onDataChanged, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    const entries = getWeightEntries();
    if (entries.length === 0) {
      onError("No hay datos para exportar.");
      setIsExporting(false);
      return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    // Nomenclatura estricta solicitada
    const fileName = `Peso_Tracker_${year}_${month}_${day}_${hour}_${min}.json`;
    const dataStr = JSON.stringify(entries, null, 2);

    // Forzamos comportamiento de descarga tradicional para Android/Móvil
    // Esto es más propenso a omitir diálogos si el navegador está configurado para descargar directamente
    try {
      const blob = new Blob([dataStr], { type: 'application/octet-stream' }); // Cambiado a octet-stream para forzar descarga
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Adjuntar al cuerpo para asegurar ejecución en navegadores móviles estrictos
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 6000);
      }, 500);

    } catch (err) {
      console.error("Error en exportación:", err);
      onError("Error al generar el archivo. Inténtalo de nuevo.");
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
        const importedData = JSON.parse(content);
        if (!Array.isArray(importedData)) throw new Error("Formato inválido.");
        importWeightEntries(importedData);
        onDataChanged();
        if (fileInputRef.current) fileInputRef.current.value = '';
        alert("¡Datos importados con éxito!");
      } catch (err) {
        onError("El archivo seleccionado no es un respaldo válido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`flex flex-col items-center justify-center p-4 border border-indigo-100 bg-indigo-50 rounded-xl text-indigo-700 active:scale-95 transition-transform hover:bg-indigo-100 ${isExporting ? 'opacity-50' : ''}`}
        >
          {isExporting ? (
            <div className="w-6 h-6 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin mb-1"></div>
          ) : (
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          )}
          <span className="text-sm font-bold">Exportar</span>
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
              <p className="font-bold text-sm">¡Exportación iniciada!</p>
              <p className="text-[10px] opacity-90 leading-tight">
                El archivo se guardará con el nombre configurado.<br/>
                Si el navegador pregunta, confirma para finalizar.
              </p>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
    </div>
  );
};
