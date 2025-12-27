
import React, { useState, useEffect, useCallback } from 'react';
import { WeightEntry, FilterPeriod } from './types';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry } from './services/localStorageService';
import { WeightInputForm } from './components/WeightInputForm';
import { WeightChart } from './components/WeightChart';
import { WeightEntryList } from './components/WeightEntryList';
import { EditWeightModal } from './components/EditWeightModal';
import { DataManagement } from './components/DataManagement';

type View = 'home' | 'history' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>(FilterPeriod.ALL);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [isLandscape, setIsLandscape] = useState(false);

  // Detectar orientación dinámicamente
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-indigo-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header - Oculto en horizontal */}
      <header className="bg-indigo-600 text-white p-4 shadow-md sticky top-0 z-40 flex justify-between items-center landscape:hidden">
        <h1 className="text-xl font-bold tracking-tight">
          {activeView === 'home' && 'Mi Progreso'}
          {activeView === 'history' && 'Historial'}
          {activeView === 'settings' && 'Ajustes'}
        </h1>
        <button 
          onClick={() => setIsMenuOpen(true)}
          className="p-2 hover:bg-indigo-500 rounded-lg transition-colors focus:outline-none"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Menú Lateral */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-64 bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="text-indigo-900 font-black text-xl">Menú</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <nav className="space-y-2">
              <MenuButton active={activeView === 'home'} onClick={() => navigateTo('home')} label="Inicio" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
              <MenuButton active={activeView === 'history'} onClick={() => navigateTo('history')} label="Historial" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>} />
              <MenuButton active={activeView === 'settings'} onClick={() => navigateTo('settings')} label="Ajustes" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            </nav>
          </div>
        </div>
      </div>

      <main className="flex-grow container mx-auto p-4 max-w-lg landscape:max-w-none landscape:p-0">
        {activeView === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500 landscape:space-y-0">
            {/* Formulario - Oculto en landscape */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 landscape:hidden">
              <h2 className="text-lg font-bold text-indigo-900 mb-4 text-center">Nuevo Registro</h2>
              <WeightInputForm onAddWeight={handleAddWeight} />
            </section>

            {/* Evolución - Altura fija en vertical, pantalla completa en landscape */}
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 landscape:fixed landscape:inset-0 landscape:z-[100] landscape:w-screen landscape:h-screen landscape:rounded-none landscape:border-none landscape:flex landscape:flex-col landscape:p-4">
              <div className="flex justify-between items-center mb-4 landscape:mb-2">
                <h2 className="text-lg font-bold text-indigo-900 landscape:text-xs">Evolución</h2>
                <select 
                  value={filterPeriod} 
                  onChange={(e) => setFilterPeriod(e.target.value as FilterPeriod)}
                  className="bg-indigo-50 border-none text-indigo-700 text-sm rounded-lg p-1 focus:ring-0"
                >
                  <option value={FilterPeriod.MONTH}>Mes</option>
                  <option value={FilterPeriod.THREE_MONTHS}>3 Meses</option>
                  <option value={FilterPeriod.YEAR}>Año</option>
                  <option value={FilterPeriod.ALL}>Todo</option>
                </select>
              </div>
              {/* Contenedor del gráfico con altura explícita para asegurar renderizado */}
              <div className="h-[350px] landscape:h-auto landscape:flex-grow flex flex-col">
                <WeightChart weightEntries={weightEntries} filterPeriod={filterPeriod} isLandscape={isLandscape} />
              </div>
            </section>
          </div>
        )}

        {activeView === 'history' && (
          <div className="animate-in fade-in duration-500 p-4">
             <WeightEntryList
                weightEntries={weightEntries}
                onEditRequest={setEditingEntry}
                onDelete={handleDeleteWeight}
              />
          </div>
        )}

        {activeView === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-500 p-4">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-indigo-900 mb-2">Copia de Seguridad</h2>
              <p className="text-xs text-slate-500 mb-4">Gestiona tus datos exportando o importando archivos JSON.</p>
              <DataManagement 
                onDataChanged={fetchWeightEntries} 
                onError={(msg) => {
                  setError(msg);
                  setTimeout(() => setError(null), 5000);
                }}
              />
            </section>
          </div>
        )}
      </main>

      {error && (
        <div className="fixed top-20 right-4 left-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-xl z-[150] animate-bounce">
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
    className={`flex items-center w-full p-4 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={`${active ? 'text-indigo-600' : 'text-slate-400'} mr-3`}>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

export default App;
