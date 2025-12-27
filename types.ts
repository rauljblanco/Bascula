export interface WeightEntry {
  date: string; // YYYY-MM-DD format
  weight: number;
}

export enum FilterPeriod {
  MONTH = 'MONTH',
  THREE_MONTHS = 'THREE_MONTHS',
  YEAR = 'YEAR',
  ALL = 'ALL',
}
