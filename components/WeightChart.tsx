import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeightEntry, FilterPeriod } from '../types';

interface WeightChartProps {
  weightEntries: WeightEntry[];
  filterPeriod: FilterPeriod;
}

export const WeightChart: React.FC<WeightChartProps> = ({ weightEntries, filterPeriod }) => {
  const [filteredData, setFilteredData] = useState<WeightEntry[]>([]);
  const [weightDifference, setWeightDifference] = useState<number | null>(null);

  const filterData = useCallback((entries: WeightEntry[], period: FilterPeriod): WeightEntry[] => {
    if (entries.length === 0) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day
    let startDate = new Date(entries[0].date); // Default to the earliest date, already sorted

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
        // For 'ALL', ensure data is sorted by date ascending for correct first/last calculation
        // and also map to add timestamp
        return entries.map(entry => ({
          ...entry,
          timestamp: new Date(entry.date).getTime()
        }));
    }

    // Filter based on the calculated startDate and then map to add timestamp
    return entries
      .filter(entry => new Date(entry.date) >= startDate)
      .map(entry => ({
        ...entry,
        timestamp: new Date(entry.date).getTime()
      }));
  }, []);

  useEffect(() => {
    // Sort entries by date ascending before filtering to ensure correct range calculation and first/last entry identification
    const sortedEntries = [...weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const newFilteredData = filterData(sortedEntries, filterPeriod);
    setFilteredData(newFilteredData);

    // Calculate weight difference
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
        <p className="text-gray-500 text-lg">No weight data available. Add your first entry!</p>
      </div>
    );
  }

  // Determine Y-axis domain dynamically
  const minWeight = filteredData.length > 0 ? Math.min(...filteredData.map(entry => entry.weight)) : 0;
  const maxWeight = filteredData.length > 0 ? Math.max(...filteredData.map(entry => entry.weight)) : 100; // Default max if no data
  const yAxisDomain = [Math.floor(minWeight - (minWeight > 0 ? 5 : 0)), Math.ceil(maxWeight + 5)]; // Add some padding, prevent negative if all weights are low

  const getDifferenceColor = (diff: number | null) => {
    if (diff === null) return 'text-gray-600';
    if (diff > 0) return 'text-red-600'; // Weight gain
    if (diff < 0) return 'text-green-600'; // Weight loss
    return 'text-gray-600'; // No change
  };

  return (
    <div className="w-full">
      {weightDifference !== null && (
        <div className="text-center mb-4 text-lg font-semibold" aria-live="polite">
          <span className="text-gray-700">Weight Change: </span>
          <span className={getDifferenceColor(weightDifference)}>
            {weightDifference > 0 ? '+' : ''}{weightDifference.toFixed(1)} kg
          </span>
        </div>
      )}
      <div className="h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="timestamp" // Use timestamp for proportional spacing
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']} // Ensure full range of data
              tickFormatter={(unixTime) => {
                const date = new Date(unixTime);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
              angle={-30}
              textAnchor="end"
              height={60}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }} // Ensures tick labels are visible
            />
            <YAxis
              domain={yAxisDomain}
              label={{ value: 'Weight', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
              itemStyle={{ color: '#4f46e5' }}
              formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Weight']}
              labelFormatter={(unixTime) => { // Format tooltip label date
                const date = new Date(unixTime);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};