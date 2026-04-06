import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { FoodAnalysisResult } from '../types/food-analysis';

type CalorieResultCardProps = {
  analysisResult: FoodAnalysisResult;
};

export function CalorieResultCard({ analysisResult }: CalorieResultCardProps) {
  const { detectedFoodName, estimatedCaloriesKcal, analysisSummary } = analysisResult;

  return (
    <View style={styles.card}>
      <Text style={styles.foodName}>{detectedFoodName}</Text>
      <Text style={styles.calorieText}>약 {estimatedCaloriesKcal} kcal</Text>
      <Text style={styles.summary}>{analysisSummary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  foodName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  calorieText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.point,
  },
  summary: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
});
