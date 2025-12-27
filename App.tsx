
import React, { useState, useEffect, useCallback } from 'react';
import { WeightEntry, FilterPeriod } from './types';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry } from './services/localStorageService';
import { WeightInputForm } from './components/WeightInputForm';
import { WeightChart } from './components/WeightChart';
import { WeightEntryList } from './components/WeightEntryList';
import { EditWeightModal } from './components/EditWeightModal';
import { DataManagement } from './components/DataManagement';

type View = 'home' | 'history' | 'backup';

function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>(FilterPeriod.ALL);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);

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
      {/* Header con botón de menú */}
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
        </h1>
        <div className="w-10"></div>
      </header>

      {/* Menú Lateral (Drawer) */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div className={`absolute top-0 left-0 h-full w-64 bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-8">
              <span className="text-indigo-900 font-black text-xl tracking-tighter">PESO TRACKER</span>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <nav className="space-y-2">
              <MenuButton 
                active={activeView === 'home'} 
                onClick={() => navigateTo('home')} 
                label="Inicio"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              />
              <MenuButton 
                active={activeView === 'history'} 
                onClick={() => navigateTo('history')} 
                label="Historial"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" /></svg>}
              />
              <MenuButton 
                active={activeView === 'backup'} 
                onClick={() => navigateTo('backup')} 
                label="Copia de seguridad"
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
              />
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
                  className="bg-indigo-50 border-none text-indigo-700 text-sm rounded-lg p-1 focus:ring-0"
                >
                  <option value={FilterPeriod.MONTH}>Mes</option>
                  <option value={FilterPeriod.THREE_MONTHS}>3 Meses</option>
                  <option value={FilterPeriod.YEAR}>Año</option>
                  <option value={FilterPeriod.ALL}>Todo</option>
                </select>
              </div>
              <WeightChart weightEntries={weightEntries} filterPeriod={filterPeriod} />
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
