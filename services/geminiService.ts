
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
};

export const getTitleSuggestions = async (baseTitle: string, imageBuffer?: string) => {
  const ai = getAIClient();
  
  const prompt = `You are a viral content expert. Take the following draft title: "${baseTitle}". 
  Generate 5 "polished" versions of this title that are more catchy, high-impact, and suitable for video covers (TikTok/YouTube). 
  Focus on curiosity, benefit, or urgency. Keep them under 10 words. 
  Return the result as a JSON array of strings.`;

  const parts: any[] = [{ text: prompt }];
  
  if (imageBuffer) {
    const base64Data = imageBuffer.split(',')[1] || imageBuffer;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return [];
  }
};
