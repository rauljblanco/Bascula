
import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeightEntry, FilterPeriod } from '../types';

interface WeightChartProps {
  weightEntries: WeightEntry[];
  filterPeriod: FilterPeriod;
  isLandscape?: boolean;
}

export const WeightChart: React.FC<WeightChartProps> = ({ weightEntries, filterPeriod, isLandscape = false }) => {
  const [filteredData, setFilteredData] = useState<WeightEntry[]>([]);
  const [weightDifference, setWeightDifference] = useState<number | null>(null);

  const filterData = useCallback((entries: WeightEntry[], period: FilterPeriod): WeightEntry[] => {
    if (entries.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    let startDate = new Date(entries[0].date);

    switch (period) {
      case FilterPeriod.MONTH:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);
        break;
      case FilterPeriod.THREE_MONTHS:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
        break;
      case FilterPeriod.YEAR:
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      case FilterPeriod.ALL:
      default:
        return entries.map(entry => ({
          ...entry,
          timestamp: new Date(entry.date).getTime()
        }));
    }

    return entries
      .filter(entry => new Date(entry.date) >= startDate)
      .map(entry => ({
        ...entry,
        timestamp: new Date(entry.date).getTime()
      }));
  }, []);

  useEffect(() => {
    const sortedEntries = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const newFilteredData = filterData(sortedEntries, filterPeriod);
    setFilteredData(newFilteredData);

    if (newFilteredData.length >= 2) {
      const firstEntryWeight = newFilteredData[0].weight;
      const lastEntryWeight = newFilteredData[newFilteredData.length - 1].weight;
      setWeightDifference(lastEntryWeight - firstEntryWeight);
    } else {
      setWeightDifference(null);
    }
  }, [weightEntries, filterPeriod, filterData]);

  if (weightEntries.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-lg">No hay datos disponibles.</p>
      </div>
    );
  }

  const minWeight = filteredData.length > 0 ? Math.min(...filteredData.map(entry => entry.weight)) : 0;
  const maxWeight = filteredData.length > 0 ? Math.max(...filteredData.map(entry => entry.weight)) : 100;
  const yAxisDomain = [Math.floor(minWeight - 1), Math.ceil(maxWeight + 1)];

  return (
    <div className="w-full h-full" style={{ touchAction: 'pan-x' }}>
      {!isLandscape && weightDifference !== null && (
        <div className="text-center mb-4 text-sm font-semibold" aria-live="polite">
          <span className="text-slate-500">Cambio periodo: </span>
          <span className={weightDifference > 0 ? 'text-rose-600' : 'text-emerald-600'}>
            {weightDifference > 0 ? '▲' : '▼'} {Math.abs(weightDifference).toFixed(1)} kg
          </span>
        </div>
      )}
      <div className={isLandscape ? "h-[80vh] pt-4" : "h-72"}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData} 
            margin={{ top: 10, right: 30, left: -20, bottom: 20 }}
            style={{ touchAction: 'pan-x' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(unixTime) => {
                const date = new Date(unixTime);
                return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
              }}
              stroke="#cbd5e1"
              tick={{ fill: '#94a3b8', fontSize: isLandscape ? 11 : 12 }}
            />
            <YAxis
              domain={yAxisDomain}
              stroke="#cbd5e1"
              tick={{ fill: '#94a3b8', fontSize: isLandscape ? 11 : 12 }}
              width={60}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                border: 'none', 
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
              labelFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              // Solo activamos por click en landscape para no interferir con el scroll horizontal
              trigger={isLandscape ? 'click' : 'hover'}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#4f46e5"
              strokeWidth={isLandscape ? 5 : 3}
              dot={{ r: isLandscape ? 4 : 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
