export type SourceRef = {
  documentId: string;
  title: string;
  page: number;
  snippet: string;
  sourceUrl?: string;
};

export type Chunk = {
  id: string;
  documentId: string;
  title: string;
  page: number;
  text: string;
  embedding: number[];
  sourceUrl?: string;
};

export type ScoredChunk = {
  chunk: Chunk;
  score: number;
};

export type GraphNode = {
  id: string;
  label: string;
  type: "document" | "entity" | "concept";
  score?: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  relation: string;
  weight: number;
};

export type GraphStore = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type QueryAnswer = {
  answer: string;
  confidence: number;
  clarification?: string[];
  sources: SourceRef[];
  reasoningTrace: string[];
};
