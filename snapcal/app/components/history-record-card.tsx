import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { CalorieHistoryRecord } from '../types/calorie-history';

type HistoryRecordCardProps = {
  record: CalorieHistoryRecord;
  onDelete: (historyRecordId: string) => void;
};

function formatRecordDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryRecordCard({ record, onDelete }: HistoryRecordCardProps) {
  const { historyRecordId, localImageUri, detectedFoodName, estimatedCaloriesKcal, createdAtIsoString } = record;

  function handleLongPress(): void {
    Alert.alert('기록 삭제', `"${detectedFoodName}" 기록을 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => onDelete(historyRecordId),
      },
    ]);
  }

  return (
    <TouchableOpacity style={styles.card} onLongPress={handleLongPress} activeOpacity={0.9}>
      <Image source={{ uri: localImageUri }} style={styles.thumbnail} resizeMode="cover" />
      <View style={styles.infoContainer}>
        <Text style={styles.foodName} numberOfLines={1}>{detectedFoodName}</Text>
        <Text style={styles.calorieText}>약 {estimatedCaloriesKcal.toLocaleString()} kcal</Text>
        <Text style={styles.dateText}>{formatRecordDate(createdAtIsoString)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  thumbnail: {
    width: 90,
    height: 90,
    backgroundColor: Colors.surface,
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  calorieText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.point,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
