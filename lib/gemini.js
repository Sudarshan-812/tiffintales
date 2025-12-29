import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash"; // Optimized for speed and cost

// Initialize SDK only if key is present
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Generates a mouth-watering description for a menu item using AI.
 * * @param {string} dishName - The name of the dish (e.g., "Paneer Butter Masala")
 * @param {string} dishType - The cuisine type (default: "North Indian")
 * @returns {Promise<string|null>} - The generated text or null if failed
 */
export const generateDishDescription = async (dishName, dishType = "North Indian") => {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
      You are a master chef copywriter. 
      Write a mouth-watering, short, 2-sentence description for a dish named "${dishName}".
      The cuisine style is ${dishType}.
      Do not use hashtags. Do not use quotes. Just the plain text.
      Make it sound homemade, authentic, and delicious.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text ? text.trim() : null;

  } catch (error) {
    // Silently fail in production to avoid crashing the UI flow
    return null;
  }
};