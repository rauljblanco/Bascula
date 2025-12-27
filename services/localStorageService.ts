import { WeightEntry } from '../types';

const STORAGE_KEY = 'weightEntries';

/**
 * Retrieves all weight entries from localStorage.
 */
export const getWeightEntries = (): WeightEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const entries: WeightEntry[] = JSON.parse(data);
      return entries
        .map(entry => ({
          ...entry,
          weight: typeof entry.weight === 'string' ? parseFloat(entry.weight) : entry.weight,
        }))
        .filter(entry => !isNaN(entry.weight))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (e) {
      console.error("Error parsing weight entries from localStorage", e);
      return [];
    }
  }
  return [];
};

/**
 * Saves a single weight entry.
 */
export const saveWeightEntry = (newEntry: WeightEntry): void => {
  const entries = getWeightEntries();
  const existingIndex = entries.findIndex(entry => entry.date === newEntry.date);

  if (existingIndex > -1) {
    entries[existingIndex] = { ...newEntry, weight: parseFloat(newEntry.weight.toFixed(2)) };
  } else {
    entries.push({ ...newEntry, weight: parseFloat(newEntry.weight.toFixed(2)) });
  }

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

/**
 * Bulk imports entries and merges them with existing ones.
 */
export const importWeightEntries = (importedEntries: WeightEntry[]): void => {
  const currentEntries = getWeightEntries();
  const entryMap = new Map<string, number>();

  currentEntries.forEach(e => entryMap.set(e.date, e.weight));
  
  importedEntries.forEach(e => {
    if (e.date && typeof e.weight === 'number' && !isNaN(e.weight)) {
      entryMap.set(e.date, parseFloat(e.weight.toFixed(2)));
    }
  });

  const finalEntries: WeightEntry[] = Array.from(entryMap.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  localStorage.setItem(STORAGE_KEY, JSON.stringify(finalEntries));
};

/**
 * Deletes a weight entry by date.
 * Accesses localStorage directly to ensure consistent deletion.
 */
export const deleteWeightEntry = (date: string): void => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return;
  
  try {
    const entries: WeightEntry[] = JSON.parse(data);
    const updatedEntries = entries.filter(entry => entry.date !== date);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (e) {
    console.error("Error deleting weight entry", e);
  }
};