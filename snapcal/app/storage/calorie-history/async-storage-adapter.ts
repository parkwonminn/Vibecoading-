import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalorieHistoryRecord } from '../../types/calorie-history';
import { StorageAdapter } from '../storage-adapter';

const CALORIE_HISTORY_STORAGE_KEY = 'snapcal_calorie_history_records';

async function loadAllRecords(): Promise<CalorieHistoryRecord[]> {
  const rawJson = await AsyncStorage.getItem(CALORIE_HISTORY_STORAGE_KEY);
  if (!rawJson) return [];
  return JSON.parse(rawJson) as CalorieHistoryRecord[];
}

async function persistRecords(records: CalorieHistoryRecord[]): Promise<void> {
  await AsyncStorage.setItem(CALORIE_HISTORY_STORAGE_KEY, JSON.stringify(records));
}

export const asyncStorageCalorieHistoryAdapter: StorageAdapter<CalorieHistoryRecord> = {
  async save(record: CalorieHistoryRecord): Promise<void> {
    const existingRecords = await loadAllRecords();
    const updatedRecords = [record, ...existingRecords];
    await persistRecords(updatedRecords);
  },

  async loadAll(): Promise<CalorieHistoryRecord[]> {
    return loadAllRecords();
  },

  async deleteById(historyRecordId: string): Promise<void> {
    const existingRecords = await loadAllRecords();
    const filteredRecords = existingRecords.filter(
      (record) => record.historyRecordId !== historyRecordId
    );
    await persistRecords(filteredRecords);
  },
};
