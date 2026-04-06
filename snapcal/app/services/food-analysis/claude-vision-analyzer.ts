import { Platform } from 'react-native';
import { FoodAnalysisResult } from '../../types/food-analysis';
import { FoodAnalysisError, FoodAnalysisService } from './food-analysis-service';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o';

const FOOD_ANALYSIS_PROMPT = `이 이미지에 있는 음식을 분석해주세요.

다음 JSON 형식으로만 응답해주세요. 다른 텍스트는 포함하지 마세요:
{
  "detectedFoodName": "음식 이름 (한국어)",
  "estimatedCaloriesKcal": 숫자,
  "analysisSummary": "간단한 설명 (예: 약 450 kcal로 추정되는 비빔밥입니다.)"
}

음식이 없거나 식별할 수 없는 경우:
{
  "detectedFoodName": "음식을 찾을 수 없음",
  "estimatedCaloriesKcal": 0,
  "analysisSummary": "이미지에서 음식을 찾을 수 없습니다. 음식 사진을 다시 촬영해주세요."
}`;

async function convertImageUriToBase64(imageUri: string): Promise<{ base64: string; mimeType: string }> {
  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { base64, mimeType };
  }

  const FileSystem = await import('expo-file-system/legacy');
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { base64, mimeType: 'image/jpeg' };
}

function parseOpenAIResponseToFoodAnalysisResult(responseText: string): FoodAnalysisResult {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new FoodAnalysisError('AI 응답에서 JSON을 찾을 수 없습니다.');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  if (
    typeof parsed.detectedFoodName !== 'string' ||
    typeof parsed.estimatedCaloriesKcal !== 'number' ||
    typeof parsed.analysisSummary !== 'string'
  ) {
    throw new FoodAnalysisError('AI 응답 형식이 올바르지 않습니다.');
  }

  return {
    detectedFoodName: parsed.detectedFoodName,
    estimatedCaloriesKcal: parsed.estimatedCaloriesKcal,
    analysisSummary: parsed.analysisSummary,
  };
}

export const claudeVisionAnalyzer: FoodAnalysisService = {
  async analyzeImageFromUri(imageUri: string): Promise<FoodAnalysisResult> {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new FoodAnalysisError('OpenAI API 키가 설정되지 않았습니다.');
    }

    const { base64: base64Image, mimeType } = await convertImageUriToBase64(imageUri);

    const requestBody = {
      model: OPENAI_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: FOOD_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new FoodAnalysisError(`API 요청 실패 (${response.status}): ${errorBody}`);
    }

    const responseJson = await response.json();
    const responseText = responseJson?.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new FoodAnalysisError('API 응답에서 텍스트를 찾을 수 없습니다.');
    }

    return parseOpenAIResponseToFoodAnalysisResult(responseText);
  },
};
