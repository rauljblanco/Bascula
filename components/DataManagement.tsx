
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
    
    const fileName = `Peso_Tracker_${year}_${month}_${day}_${hour}_${min}.json`;
    const dataStr = JSON.stringify(entries, null, 2);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'Archivo JSON',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        setIsExporting(false);
        setExportSuccess(true);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setIsExporting(false);
          return;
        }
      }
    }

    // Fallback Robusto
    try {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.visibility = 'hidden';
      link.style.position = 'absolute';
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportSuccess(true);
        // Ocultar mensaje de éxito tras unos segundos
        setTimeout(() => setExportSuccess(false), 6000);
      }, 500);

    } catch (err) {
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in slide-in-from-top-2">
          <p className="text-emerald-700 text-xs font-bold leading-tight">
            ✅ ¡Copia guardada con éxito!<br/>
            Busca el archivo en tu <span className="underline">carpeta de descargas</span>.
          </p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
    </div>
  );
};
