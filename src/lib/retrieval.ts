import type { Chunk, ScoredChunk, SourceRef } from "@/lib/types";

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

const normalizeToken = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

const tokenize = (value: string): string[] =>
  value
    .split(/\s+/)
    .map(normalizeToken)
    .filter((token) => token.length > 2);

const lexicalScore = (question: string, text: string) => {
  const q = new Set(tokenize(question));
  const t = new Set(tokenize(text));
  if (q.size === 0 || t.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of q) {
    if (t.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.sqrt(q.size * t.size);
};

export const rankChunks = (question: string, queryEmbedding: number[], chunks: Chunk[]): ScoredChunk[] => {
  return [...chunks]
    .map((chunk) => {
      const dense = cosineSimilarity(queryEmbedding, chunk.embedding);
      const sparse = lexicalScore(question, `${chunk.title} ${chunk.text}`);
      const fusedScore = 0.75 * dense + 0.25 * sparse;
      return { chunk, score: fusedScore };
    })
    .sort((a, b) => b.score - a.score);
};

export const topKChunks = (question: string, queryEmbedding: number[], chunks: Chunk[], k = 5): Chunk[] => {
  return rankChunks(question, queryEmbedding, chunks)
    .slice(0, k)
    .map((item) => item.chunk);
};

export const chunkToSource = (chunk: Chunk): SourceRef => ({
  documentId: chunk.documentId,
  title: chunk.title,
  page: chunk.page,
  snippet: chunk.text.slice(0, 200),
  sourceUrl: chunk.sourceUrl,
});
