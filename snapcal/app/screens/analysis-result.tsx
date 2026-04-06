import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalorieResultCard } from '../components/calorie-result-card';
import { CaptureActionButton } from '../components/capture-action-button';
import { FoodImagePreview } from '../components/food-image-preview';
import { LoadingAnalysisOverlay } from '../components/loading-analysis-overlay';
import { Colors } from '../constants/colors';
import { Strings } from '../constants/strings';
import { claudeVisionAnalyzer } from '../services/food-analysis';
import { asyncStorageCalorieHistoryAdapter } from '../storage/calorie-history';
import { FoodAnalysisResult } from '../types/food-analysis';
import { generateUniqueRecordId } from '../utils/generate-unique-record-id';

export default function AnalysisResultScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (imageUri) {
      runFoodAnalysis(imageUri);
    }
  }, [imageUri]);

  async function runFoodAnalysis(imageUriToAnalyze: string): Promise<void> {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await claudeVisionAnalyzer.analyzeImageFromUri(imageUriToAnalyze);
      setAnalysisResult(result);
    } catch {
      setAnalysisError(Strings.analysisErrorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSaveResult(): Promise<void> {
    if (!analysisResult || !imageUri) return;

    setIsSaving(true);
    try {
      await asyncStorageCalorieHistoryAdapter.save({
        historyRecordId: generateUniqueRecordId(),
        localImageUri: imageUri,
        detectedFoodName: analysisResult.detectedFoodName,
        estimatedCaloriesKcal: analysisResult.estimatedCaloriesKcal,
        analysisSummary: analysisResult.analysisSummary,
        createdAtIsoString: new Date().toISOString(),
      });

      router.replace('/(tabs)/history');
    } catch {
      Alert.alert('저장 실패', '저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleRetake(): void {
    router.back();
  }

  function handleRetryAnalysis(): void {
    if (imageUri) {
      runFoodAnalysis(imageUri);
    }
  }

  if (!imageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>이미지를 불러올 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LoadingAnalysisOverlay isVisible={isAnalyzing} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <FoodImagePreview imageUri={imageUri} />

        <View style={styles.contentContainer}>
          {analysisError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{analysisError}</Text>
              <View style={styles.buttonGap} />
              <CaptureActionButton
                label={Strings.reanalyzeButtonLabel}
                variant="primary"
                onPress={handleRetryAnalysis}
              />
            </View>
          ) : analysisResult ? (
            <CalorieResultCard analysisResult={analysisResult} />
          ) : null}
        </View>
      </ScrollView>

      {analysisResult && !analysisError && (
        <View style={styles.actionButtonsContainer}>
          <CaptureActionButton
            label={isSaving ? '저장 중...' : Strings.saveButtonLabel}
            variant="primary"
            onPress={handleSaveResult}
          />
          <View style={styles.buttonGap} />
          <CaptureActionButton
            label={Strings.retakeButtonLabel}
            variant="secondary"
            onPress={handleRetake}
          />
        </View>
      )}

      {analysisError && (
        <View style={styles.actionButtonsContainer}>
          <CaptureActionButton
            label={Strings.retakeButtonLabel}
            variant="secondary"
            onPress={handleRetake}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  errorContainer: {
    paddingVertical: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtonsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buttonGap: {
    height: 12,
  },
});
