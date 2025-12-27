import React, { useState, useEffect, useCallback } from 'react';
import { WeightEntry, FilterPeriod } from './types';
import { getWeightEntries, saveWeightEntry, deleteWeightEntry } from './services/localStorageService';
import { WeightInputForm } from './components/WeightInputForm';
import { WeightChart } from './components/WeightChart';
import { WeightEntryList } from './components/WeightEntryList';
import { EditWeightModal } from './components/EditWeightModal';
import { DataManagement } from './components/DataManagement';

function App() {
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
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeightEntries();
  }, [fetchWeightEntries]);

  const handleAddWeight = useCallback((date: string, weight: number) => {
    try {
      const newEntry: WeightEntry = { date, weight };
      saveWeightEntry(newEntry);
      fetchWeightEntries();
    } catch (e) {
      setError("Error al guardar el registro.");
      console.error(e);
    }
  }, [fetchWeightEntries]);

  const handleDeleteWeight = useCallback((date: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este registro de peso?")) {
      try {
        deleteWeightEntry(date);
        fetchWeightEntries();
      } catch (e) {
        setError("Error al eliminar el registro.");
        console.error(e);
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
      console.error(e);
    }
  }, [fetchWeightEntries]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-xl text-indigo-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-indigo-800 tracking-tight sm:text-5xl">
          Weight Tracker
        </h1>
        <p className="mt-3 text-lg text-indigo-600 max-w-md mx-auto">
          Monitoriza tu evolución día a día.
        </p>
      </header>

      <main className="container mx-auto max-w-3xl space-y-8">
        {/* 1. Nuevo Registro */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Añadir Nuevo Registro</h2>
          <WeightInputForm onAddWeight={handleAddWeight} />
        </section>

        {/* 2. Tu Progreso (Gráfico) */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Tu Progreso</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <FilterButton label="Mes" period={FilterPeriod.MONTH} currentPeriod={filterPeriod} onClick={setFilterPeriod} />
            <FilterButton label="3 Meses" period={FilterPeriod.THREE_MONTHS} currentPeriod={filterPeriod} onClick={setFilterPeriod} />
            <FilterButton label="Año" period={FilterPeriod.YEAR} currentPeriod={filterPeriod} onClick={setFilterPeriod} />
            <FilterButton label="Todo" period={FilterPeriod.ALL} currentPeriod={filterPeriod} onClick={setFilterPeriod} />
          </div>
          <WeightChart weightEntries={weightEntries} filterPeriod={filterPeriod} />
        </section>

        {/* 3. Historial de Entradas */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
          <h2 className="text-2xl font-bold text-indigo-700 mb-6">Historial de Entradas</h2>
          <WeightEntryList
            weightEntries={weightEntries}
            onEditRequest={setEditingEntry}
            onDelete={handleDeleteWeight}
          />
        </section>

        {/* 4. Gestión de Datos */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Gestión de Datos</h2>
          <p className="text-sm text-gray-500 mb-4">Copia de seguridad y restauración de tus registros.</p>
          <DataManagement 
            onDataChanged={fetchWeightEntries} 
            onError={(msg) => {
              setError(msg);
              setTimeout(() => setError(null), 5000);
            }}
          />
        </section>
      </main>

      {/* Notificación de Error */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl z-[60] animate-pulse">
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

      <footer className="mt-12 text-center text-indigo-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Weight Tracker App. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

interface FilterButtonProps {
  label: string;
  period: FilterPeriod;
  currentPeriod: FilterPeriod;
  onClick: (period: FilterPeriod) => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, period, currentPeriod, onClick }) => {
  const isActive = period === currentPeriod;
  return (
    <button
      onClick={() => onClick(period)}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out
        ${isActive
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-gray-200 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'
        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
};

export default App;