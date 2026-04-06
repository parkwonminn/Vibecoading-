import { FoodAnalysisResult } from '../../types/food-analysis';

export interface FoodAnalysisService {
  analyzeImageFromUri(imageUri: string): Promise<FoodAnalysisResult>;
}

export class FoodAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FoodAnalysisError';
  }
}
