
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { WeightEntry, FilterPeriod } from './types';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry } from './services/localStorageService';
import { WeightInputForm } from './components/WeightInputForm';
import { WeightChart } from './components/WeightChart';
import { WeightEntryList } from './components/WeightEntryList';
import { EditWeightModal } from './components/EditWeightModal';
import { DataManagement } from './components/DataManagement';

type View = 'home' | 'history' | 'backup' | 'about';

function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>(FilterPeriod.ALL);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);
  const landscapeScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const landscape = window.innerWidth > window.innerHeight && window.innerWidth < 1024;
      setIsLandscape(landscape);
      
      if (landscape) {
        setTimeout(() => {
          if (landscapeScrollRef.current) {
            landscapeScrollRef.current.scrollLeft = landscapeScrollRef.current.scrollWidth;
          }
        }, 200);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [weightEntries.length, activeView]);

  const fetchWeightEntries = useCallback(() => {
    try {
      const entries = getWeightEntries();
      setWeightEntries(entries);
      setLoading(false);
    } catch (e) {
      setError("Error al cargar los registros de peso.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeightEntries();
  }, [fetchWeightEntries]);

  /**
   * Función de exportación robusta.
   * Intenta usar Web Share API para una mejor experiencia móvil.
   * Si el navegador deniega el permiso o no es compatible, cae automáticamente 
   * a la descarga tradicional por enlace (blob).
   */
  const handleExportMobile = useCallback(async () => {
    if (weightEntries.length === 0) {
      setError("No hay datos para exportar.");
      return;
    }

    const dataStr = JSON.stringify(weightEntries, null, 2);
    const fileName = `pesos_tracker_${new Date().toISOString().split('T')[0]}.json`;

    // Función interna para realizar la descarga tradicional
    const triggerDownloadFallback = () => {
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);
    };

    try {
      // Comprobar soporte básico de Share API
      if (navigator.share && navigator.canShare) {
        const file = new File([dataStr], fileName, { type: 'application/json' });
        
        // Comprobar si este tipo de archivo se puede compartir
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Copia de Seguridad Peso Tracker',
            text: 'Mis registros de peso'
          });
          return; // Compartido con éxito
        }
      }
      
      // Si no hay soporte o canShare es false, usamos el fallback directamente
      triggerDownloadFallback();
      
    } catch (e) {
      const err = e as Error;
      
      // Si el usuario canceló el diálogo nativo, no hacemos nada
      if (err.name === 'AbortError') return;

      // Si falló por "Permission denied" u otros motivos, intentamos el fallback como última opción
      console.warn("Fallo en navigator.share (posible falta de permisos). Intentando descarga tradicional.", err);
      
      try {
        triggerDownloadFallback();
      } catch (fallbackError) {
        console.error("Error crítico: Falló incluso la descarga tradicional.", fallbackError);
        setError("No se pudo completar la exportación de ninguna forma.");
      }
    }
  }, [weightEntries]);

  const handleAddWeight = useCallback((date: string, weight: number) => {
    try {
      saveWeightEntry({ date, weight });
      fetchWeightEntries();
    } catch (e) {
      setError("Error al guardar el registro.");
    }
  }, [fetchWeightEntries]);

  const handleDeleteWeight = useCallback((date: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este registro?")) {
      try {
        deleteWeightEntry(date);
        fetchWeightEntries();
      } catch (e) {
        setError("Error al eliminar el registro.");
      }
    }
  }, [fetchWeightEntries]);

  const handleSaveEditedWeight = useCallback((date: string, weight: number) => {
    try {
      saveWeightEntry({ date, weight });
      fetchWeightEntries();
      setEditingEntry(null);
    } catch (e) {
      setError("Error al actualizar el registro.");
    }
  }, [fetchWeightEntries]);

  const navigateTo = (view: View) => {
    setActiveView(view);
    setIsMenuOpen(false);
  };

  const calculateForecast = () => {
    if (weightEntries.length < 2) return null;
    const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
    const recentEntries = weightEntries.filter(e => new Date(e.date).getTime() >= sixtyDaysAgo);

    if (recentEntries.length < 2) return { error: "Faltan datos recientes (60d)" };

    const data = recentEntries.map(e => ({
      x: new Date(e.date).getTime(),
      y: e.weight
    }));

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumXX += p.x * p.x;
    });

    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return { error: "Datos insuficientes para tendencia" };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const oneMonthInMs = 30 * 24 * 60 * 60 * 1000;
    const futureTime = Date.now() + oneMonthInMs;
    const predictedWeight = slope * futureTime + intercept;
    
    return {
      weight: predictedWeight,
      trend: slope * oneMonthInMs
    };
  };

  const forecast = calculateForecast();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isLandscape) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-indigo-600 text-white shadow-md">
          <h2 className="text-xs font-black uppercase tracking-widest">Peso Tracker • Panorama</h2>
          <button 
            onClick={() => setIsLandscape(false)} 
            className="text-[10px] bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full font-bold uppercase transition-colors"
          >
            Cerrar Vista
          </button>
        </div>
        <div 
          ref={landscapeScrollRef}
          className="flex-grow overflow-x-auto overflow-y-hidden bg-white"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x'
          }}
        >
          <div 
            style={{ 
              width: `${Math.max(window.innerWidth + 10, weightEntries.length * 60)}px`,
              height: '100%',
              touchAction: 'pan-x'
            }} 
            className="px-4 py-2"
          >
            <WeightChart weightEntries={weightEntries} filterPeriod={filterPeriod} isLandscape={true} />
          </div>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 py-1 text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Desliza para ver días anteriores • Pulsa en los puntos para ver el peso</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-40 flex justify-between items-center">
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-indigo-500 rounded-lg transition-colors focus:outline-none"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold tracking-tight">
          {activeView === 'home' && 'Mi Progreso'}
          {activeView === 'history' && 'Historial'}
          {activeView === 'backup' && 'Copia de seguridad'}
          {activeView === 'about' && 'Acerca de...'}
        </h1>
        <div className="w-10"></div>
      </header>

      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 left-0 h-full w-64 bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <span className="text-indigo-900 font-black text-xl tracking-tighter uppercase">Peso Tracker</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <nav className="space-y-2 flex-grow">
              <MenuButton active={activeView === 'home'} onClick={() => navigateTo('home')} label="Inicio" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
              <MenuButton active={activeView === 'history'} onClick={() => navigateTo('history')} label="Historial" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
              <MenuButton active={activeView === 'backup'} onClick={() => navigateTo('backup')} label="Copia de seguridad" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>} />
              <MenuButton active={activeView === 'about'} onClick={() => navigateTo('about')} label="Acerca de..." icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </nav>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto p-4 max-w-lg">
        {activeView === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-indigo-900 mb-4">Nuevo Registro</h2>
              <WeightInputForm onAddWeight={handleAddWeight} />
            </section>

            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-indigo-900">Evolución</h2>
                <select 
                  value={filterPeriod} 
                  onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                  className="bg-indigo-50 border-none text-indigo-700 text-sm rounded-lg p-1"
                >
                  <option value={FilterPeriod.MONTH}>Mes</option>
                  <option value={FilterPeriod.THREE_MONTHS}>3 Meses</option>
                  <option value={FilterPeriod.YEAR}>Año</option>
                  <option value={FilterPeriod.ALL}>Todo</option>
                </select>
              </div>
              <WeightChart weightEntries={weightEntries} filterPeriod={filterPeriod} />
              <p className="text-[10px] text-center text-slate-400 mt-2 italic">Gira el móvil para ver el gráfico en pantalla completa</p>
            </section>

            <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Tendencia actual (60d)
              </h2>
              {forecast && !('error' in forecast) ? (
                <div>
                  <p className="text-3xl font-black mb-1">{(forecast as any).weight.toFixed(1)} <span className="text-sm font-normal opacity-80">kg</span></p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${(forecast as any).trend > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
                    {(forecast as any).trend > 0 ? 'Tendencia al alza' : 'Tendencia a la baja'} ({(forecast as any).trend > 0 ? '+' : ''}{(forecast as any).trend.toFixed(1)} kg/mes)
                  </p>
                  <p className="mt-4 text-[10px] opacity-60 leading-tight italic">* Previsión a 30 días basada en tus registros de los últimos 2 meses.</p>
                </div>
              ) : (
                <p className="text-sm opacity-80">
                  {forecast && 'error' in (forecast as any) 
                    ? (forecast as any).error 
                    : "Introduce datos para calcular tu tendencia."}
                </p>
              )}
            </section>
          </div>
        )}

        {activeView === 'history' && (
          <div className="animate-in fade-in duration-500">
             <WeightEntryList
                weightEntries={weightEntries}
                onEditRequest={setEditingEntry}
                onDelete={handleDeleteWeight}
              />
          </div>
        )}

        {activeView === 'backup' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-indigo-900 mb-2">Gestión de Datos</h2>
              <p className="text-xs text-slate-500 mb-4">Exporta tus registros para guardarlos o impórtalos para restaurar tu progreso.</p>
              <DataManagement 
                onDataChanged={fetchWeightEntries} 
                onExport={handleExportMobile}
                onError={(msg) => {
                  setError(msg);
                  setTimeout(() => setError(null), 5000);
                }}
              />
            </section>
          </div>
        )}

        {activeView === 'about' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-1 uppercase tracking-tight">Peso Tracker</h2>
            <p className="text-indigo-600 font-bold text-sm mb-6">Versión 2.9</p>
            <div className="space-y-4 text-slate-600">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400 tracking-widest">Autor</p>
                <p className="text-lg font-bold">Raúl Jaime</p>
              </div>
              <p className="text-sm pt-4 border-t border-slate-50 italic">Tu compañero diario para el control de bienestar.</p>
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed top-20 right-4 left-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-xl z-50 animate-bounce">
          {error}
        </div>
      )}

      {editingEntry && (
        <EditWeightModal
          entry={editingEntry}
          onSave={handleSaveEditedWeight}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

const MenuButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-4 rounded-xl transition-all duration-200 ${active ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={`${active ? 'text-indigo-600' : 'text-slate-400'} mr-3`}>
      {icon}
    </span>
    <span className="text-sm">{label}</span>
  </button>
);

export default App;
