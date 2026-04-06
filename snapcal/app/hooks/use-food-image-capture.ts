import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { claudeVisionAnalyzer } from '../services/food-analysis';
import { FoodAnalysisResult } from '../types/food-analysis';

type FoodImageCaptureState = {
  isAnalyzing: boolean;
  analysisError: string | null;
  lastAnalysisResult: FoodAnalysisResult | null;
  capturedImageUri: string | null;
};

type FoodImageCaptureActions = {
  captureFromCamera: () => Promise<void>;
  selectFromGallery: () => Promise<void>;
  clearError: () => void;
  resetResult: () => void;
};

export function useFoodImageCapture(): FoodImageCaptureState & FoodImageCaptureActions {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [lastAnalysisResult, setLastAnalysisResult] = useState<FoodAnalysisResult | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  async function analyzeSelectedImage(imageUri: string): Promise<void> {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCapturedImageUri(imageUri);

    try {
      const result = await claudeVisionAnalyzer.analyzeImageFromUri(imageUri);
      setLastAnalysisResult(result);
    } catch {
      setAnalysisError('분석에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function captureFromCamera(): Promise<void> {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      setAnalysisError('카메라 권한이 필요합니다. 설정에서 카메라 권한을 허용해 주세요.');
      return;
    }

    const captureResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!captureResult.canceled && captureResult.assets[0]) {
      await analyzeSelectedImage(captureResult.assets[0].uri);
    }
  }

  async function selectFromGallery(): Promise<void> {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setAnalysisError('사진 라이브러리 권한이 필요합니다. 설정에서 권한을 허용해 주세요.');
      return;
    }

    const selectionResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!selectionResult.canceled && selectionResult.assets[0]) {
      await analyzeSelectedImage(selectionResult.assets[0].uri);
    }
  }

  function clearError(): void {
    setAnalysisError(null);
  }

  function resetResult(): void {
    setLastAnalysisResult(null);
    setCapturedImageUri(null);
    setAnalysisError(null);
  }

  return {
    isAnalyzing,
    analysisError,
    lastAnalysisResult,
    capturedImageUri,
    captureFromCamera,
    selectFromGallery,
    clearError,
    resetResult,
  };
}
