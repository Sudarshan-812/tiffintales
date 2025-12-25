import { GoogleGenerativeAI } from "@google/generative-ai";

// 🔑 PASTE YOUR API KEY HERE
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY; // Secure

const genAI = new GoogleGenerativeAI(API_KEY);

export const generateDishDescription = async (dishName, dishType = "North Indian") => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      You are a master chef copywriter. 
      Write a mouth-watering, short, 2-sentence description for a dish named "${dishName}".
      The cuisine style is ${dishType}.
      Do not use hashtags. Do not use quotes. Just the text.
      Make it sound homemade and delicious.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};