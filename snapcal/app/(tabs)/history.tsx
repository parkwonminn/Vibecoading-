import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet } from 'react-native';
import { AppHeader } from '../components/app-header';
import { DailyCalorieSummary } from '../components/daily-calorie-summary';
import { EmptyHistoryView } from '../components/empty-history-view';
import { HistoryRecordCard } from '../components/history-record-card';
import { Colors } from '../constants/colors';
import { asyncStorageCalorieHistoryAdapter } from '../storage/calorie-history';
import { CalorieHistoryRecord } from '../types/calorie-history';

function isTodayRecord(isoString: string): boolean {
  const recordDate = new Date(isoString);
  const today = new Date();
  return (
    recordDate.getFullYear() === today.getFullYear() &&
    recordDate.getMonth() === today.getMonth() &&
    recordDate.getDate() === today.getDate()
  );
}

function calculateTodayTotalCalories(records: CalorieHistoryRecord[]): number {
  return records
    .filter((record) => isTodayRecord(record.createdAtIsoString))
    .reduce((total, record) => total + record.estimatedCaloriesKcal, 0);
}

export default function HistoryScreen() {
  const [historyRecords, setHistoryRecords] = useState<CalorieHistoryRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistoryRecords();
    }, [])
  );

  async function loadHistoryRecords(): Promise<void> {
    const records = await asyncStorageCalorieHistoryAdapter.loadAll();
    const sortedByLatest = [...records].sort(
      (a, b) => new Date(b.createdAtIsoString).getTime() - new Date(a.createdAtIsoString).getTime()
    );
    setHistoryRecords(sortedByLatest);
  }

  async function handleDeleteRecord(historyRecordId: string): Promise<void> {
    await asyncStorageCalorieHistoryAdapter.deleteById(historyRecordId);
    await loadHistoryRecords();
  }

  const todayTotalCalories = calculateTodayTotalCalories(historyRecords);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      {historyRecords.length > 0 && (
        <DailyCalorieSummary totalCaloriesKcal={todayTotalCalories} />
      )}
      <FlatList
        data={historyRecords}
        keyExtractor={(record) => record.historyRecordId}
        renderItem={({ item }) => (
          <HistoryRecordCard record={item} onDelete={handleDeleteRecord} />
        )}
        ListEmptyComponent={<EmptyHistoryView />}
        contentContainerStyle={historyRecords.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flex: 1,
  },
});
