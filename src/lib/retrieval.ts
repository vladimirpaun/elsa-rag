import type { Chunk, SourceRef } from "@/lib/types";

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
};

export const topKChunks = (queryEmbedding: number[], chunks: Chunk[], k = 5): Chunk[] => {
  return [...chunks]
    .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((item) => item.chunk);
};

export const chunkToSource = (chunk: Chunk): SourceRef => ({
  documentId: chunk.documentId,
  title: chunk.title,
  page: chunk.page,
  snippet: chunk.text.slice(0, 200),
});
