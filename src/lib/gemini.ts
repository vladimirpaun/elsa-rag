import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GOOGLE_API_KEY;
const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const generationModel = process.env.GEMINI_GENERATION_MODEL ?? "gemini-3-pro-preview";


const mockEmbedding = (text: string): number[] => {
  const vector = new Array<number>(128).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const index = i % vector.length;
    vector[index] = (vector[index] + text.charCodeAt(i) / 255) % 1;
  }
  return vector;
};

export const getGeminiClient = () => {
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const embedText = async (text: string): Promise<number[]> => {
  if (!apiKey && process.env.ALLOW_MOCK_EMBEDDINGS === "true") {
    return mockEmbedding(text);
  }

  const client = getGeminiClient();
  const result = await client.models.embedContent({
    model: embeddingModel,
    contents: text,
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini embedding returned empty vector.");
  }
  return values;
};

export const embeddingsHealthcheck = async () => {
  const vector = await embedText("healthcheck: refrigeration system");
  return {
    model: embeddingModel,
    dimensions: vector.length,
    provider: !apiKey && process.env.ALLOW_MOCK_EMBEDDINGS === "true" ? "mock" : "gemini",
    generationModel,
  };
};

export const getGenerationModel = () => generationModel;
