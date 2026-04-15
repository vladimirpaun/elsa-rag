import { promises as fs } from "node:fs";
import path from "node:path";
import type { Chunk, GraphStore } from "@/lib/types";

const basePath = process.env.ELSA_STORAGE_PATH ?? "./data";

const ensureDir = async () => {
  await fs.mkdir(basePath, { recursive: true });
};

export const saveChunks = async (chunks: Chunk[]) => {
  await ensureDir();
  await fs.writeFile(path.join(basePath, "chunks.json"), JSON.stringify(chunks, null, 2));
};

export const loadChunks = async (): Promise<Chunk[]> => {
  try {
    const content = await fs.readFile(path.join(basePath, "chunks.json"), "utf8");
    return JSON.parse(content) as Chunk[];
  } catch {
    return [];
  }
};

export const saveGraph = async (graph: GraphStore) => {
  await ensureDir();
  await fs.writeFile(path.join(basePath, "graph.json"), JSON.stringify(graph, null, 2));
};

export const loadGraph = async (): Promise<GraphStore> => {
  try {
    const content = await fs.readFile(path.join(basePath, "graph.json"), "utf8");
    return JSON.parse(content) as GraphStore;
  } catch {
    return { nodes: [], edges: [] };
  }
};
