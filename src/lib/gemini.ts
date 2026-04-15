import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;

export const getGeminiClient = () => {
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const embedText = async (text: string): Promise<number[]> => {
  const client = getGeminiClient();
  const result = await client.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini embedding returned empty vector.");
  }
  return values;
};
