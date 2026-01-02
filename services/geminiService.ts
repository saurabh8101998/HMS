import { GoogleGenAI } from "@google/genai";
import { SPECIALTIES } from "../constants";

export const suggestSpecialist = async (symptoms: string): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is not set. Skipping AI suggestion.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are a medical assistant helper. Based on the following symptoms, suggest the most appropriate medical specialty from this specific list: ${SPECIALTIES.join(', ')}.
      
      Symptoms: "${symptoms}"
      
      Return ONLY the exact name of the specialty from the list. If it's unclear or general, return "General Practitioner". Do not add any explanation or extra text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const text = response.text?.trim();
    if (text && SPECIALTIES.includes(text)) {
      return text;
    }
    return "General Practitioner";
  } catch (error) {
    console.error("Error fetching AI suggestion:", error);
    return null;
  }
};