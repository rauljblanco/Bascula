
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
    
    // Nomenclatura exacta solicitada: Peso_Tracker_%año_%mes_%dia_%hora
    const fileName = `Peso_Tracker_${year}_${month}_${day}_${hour}_${min}.json`;
    const dataStr = JSON.stringify(entries, null, 2);

    // Detección de móvil para evitar showSaveFilePicker (que siempre pregunta)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // En PC (no móvil), intentamos la API moderna si está disponible
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

    // MÉTODO FORZADO (Móviles y Fallback): Usa el enlace con atributo download
    // En la mayoría de Androids con Chrome, esto inicia la descarga directa si el nombre es sugerido
    try {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Aseguramos que el link esté en el DOM para mayor compatibilidad
      document.body.appendChild(link);
      link.click();
      
      // Esperamos un poco antes de limpiar para que el navegador procese la descarga
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportSuccess(true);
        // Ocultar mensaje de éxito tras unos segundos
        setTimeout(() => setExportSuccess(false), 8000);
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
              <p className="font-bold text-sm">¡Archivo guardado!</p>
              <p className="text-[10px] opacity-90 leading-tight">
                El archivo se ha descargado automáticamente.<br/>
                Búscalo en tu carpeta de <strong>Descargas</strong> del dispositivo.
              </p>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
    </div>
  );
};
