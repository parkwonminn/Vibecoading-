export type CalorieHistoryRecord = {
  historyRecordId: string;
  localImageUri: string;
  detectedFoodName: string;
  estimatedCaloriesKcal: number;
  analysisSummary: string;
  createdAtIsoString: string;
};
