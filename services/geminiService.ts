
import { GoogleGenAI, Type } from "@google/genAI";
import { Nutrients } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable not set.");
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

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    // Basic validation
    if (
        typeof parsedJson.mealName === 'string' &&
        typeof parsedJson.calories === 'number' &&
        typeof parsedJson.protein === 'number' &&
        typeof parsedJson.carbs === 'number' &&
        typeof parsedJson.fat === 'number' &&
        typeof parsedJson.portionSize === 'string'
    ) {
        return parsedJson as Nutrients;
    } else {
        throw new Error("Gemini response is missing required fields or has incorrect types.");
    }

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error("Failed to get nutritional data from the image. The analysis may have failed or the response was not in the expected format.");
  }
};
