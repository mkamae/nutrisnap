
import { GoogleGenAI, Type } from "@google/genai";
import { Nutrients } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing Gemini API key');
  console.error('VITE_GEMINI_API_KEY:', API_KEY ? '✅ Set' : '❌ Missing');
  throw new Error("VITE_GEMINI_API_KEY environment variable not set. Check your .env.local file.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = "gemini-2.5-flash";

const nutritionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    mealName: {
      type: Type.STRING,
      description: "A descriptive name for the meal, like 'Grilled Chicken Salad' or 'Spaghetti Bolognese'."
    },
    calories: {
      type: Type.INTEGER,
      description: "Estimated total calories for the portion shown."
    },
    protein: {
      type: Type.INTEGER,
      description: "Estimated grams of protein."
    },
    carbs: {
      type: Type.INTEGER,
      description: "Estimated grams of carbohydrates."
    },
    fat: {
      type: Type.INTEGER,
      description: "Estimated grams of fat."
    },
    portionSize: {
        type: Type.STRING,
        description: "An estimation of the portion size, e.g., 'approx. 300g' or '1 medium bowl'."
    }
  },
  required: ["mealName", "calories", "protein", "carbs", "fat", "portionSize"]
};

export const analyzeImageWithGemini = async (base64Image: string, mimeType: string): Promise<Nutrients> => {
  try {
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    const textPart = {
      text: "Analyze the food in this image. Provide a detailed nutritional estimate for the portion shown. Identify the meal and estimate its calories, protein, carbohydrates, fat, and portion size. Respond in JSON format.",
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: nutritionResponseSchema
      }
    });

    // Some models wrap JSON in code fences or include extra text; extract JSON safely
    let raw = response.text.trim();
    const fenceStart = raw.indexOf('{');
    const fenceEnd = raw.lastIndexOf('}');
    if (fenceStart !== -1 && fenceEnd !== -1 && fenceEnd > fenceStart) {
      raw = raw.slice(fenceStart, fenceEnd + 1);
    }

    const parsed = JSON.parse(raw);

    // Coerce numeric fields even if strings with units are returned
    const toNumber = (v: any): number => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
        if (!isNaN(n)) return n;
      }
      throw new Error('Invalid numeric value');
    };

    const result: Nutrients = {
      mealName: String(parsed.mealName ?? parsed.mealname ?? 'Analyzed meal'),
      calories: toNumber(parsed.calories),
      protein: toNumber(parsed.protein),
      carbs: toNumber(parsed.carbs),
      fat: toNumber(parsed.fat),
      portionSize: parsed.portionSize ?? parsed.portionsize ?? undefined
    };
    
    // Basic validation
    if (!result.mealName || [result.calories, result.protein, result.carbs, result.fat].some(v => typeof v !== 'number')) {
      throw new Error('Gemini response missing required fields');
    }
    return result;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to get nutritional data from the image. The analysis may have failed or the response was not in the expected format.");
  }
};
