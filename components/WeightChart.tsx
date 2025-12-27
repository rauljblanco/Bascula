
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
    if (entries.length === 0) {
      return [];
    }

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
      <div className="flex justify-center items-center h-full min-h-[250px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-sm">Sin datos para mostrar el gráfico</p>
      </div>
    );
  }

  const weights = filteredData.map(entry => entry.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 100;
  
  const range = maxWeight - minWeight;
  const padding = range === 0 ? 5 : range * 0.15;
  const yAxisDomain = [Math.floor(minWeight - padding), Math.ceil(maxWeight + padding)];

  const getDifferenceColor = (diff: number | null) => {
    if (diff === null) return 'text-slate-600';
    if (diff > 0) return 'text-rose-600';
    if (diff < 0) return 'text-emerald-600';
    return 'text-slate-600';
  };

  return (
    <div className="w-full h-full flex flex-col">
      {weightDifference !== null && (
        <div className={`text-center font-bold mb-2 ${isLandscape ? 'text-xs' : 'text-sm'}`} aria-live="polite">
          <span className="text-slate-500 uppercase tracking-tighter mr-1">Variación:</span>
          <span className={getDifferenceColor(weightDifference)}>
            {weightDifference > 0 ? '+' : ''}{weightDifference.toFixed(1)} kg
          </span>
        </div>
      )}
      <div className="flex-grow w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{
              top: 10,
              right: 20,
              left: -15,
              bottom: 10,
            }}
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
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: isLandscape ? 10 : 11 }}
              height={30}
            />
            <YAxis
              domain={yAxisDomain}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: isLandscape ? 10 : 11 }}
              tickFormatter={(value) => `${value}`}
              width={45}
              orientation="left"
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                border: 'none', 
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Peso']}
              labelFormatter={(unixTime) => {
                const date = new Date(unixTime);
                return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#4f46e5"
              strokeWidth={isLandscape ? 4 : 3}
              dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
