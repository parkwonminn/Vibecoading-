import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';

type DailyCalorieSummaryProps = {
  totalCaloriesKcal: number;
};

export function DailyCalorieSummary({ totalCaloriesKcal }: DailyCalorieSummaryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{Strings.todayCalorieSummaryLabel}</Text>
      <Text style={styles.calorieValue}>약 {totalCaloriesKcal.toLocaleString()} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.point,
  },
});
