import type { Chunk, GraphStore } from "@/lib/types";

export const buildGraph = (chunks: Chunk[]): GraphStore => {
  const nodes = new Map<string, GraphStore["nodes"][number]>();
  const edges: GraphStore["edges"] = [];

  for (const chunk of chunks) {
    nodes.set(chunk.documentId, {
      id: chunk.documentId,
      label: chunk.title,
      type: "document",
    });

    const entities = extractEntities(chunk.text);
    for (const entity of entities) {
      const entityId = `entity:${entity.toLowerCase()}`;
      if (!nodes.has(entityId)) {
        nodes.set(entityId, {
          id: entityId,
          label: entity,
          type: "entity",
        });
      }
      edges.push({
        from: chunk.documentId,
        to: entityId,
        relation: "mentions",
        weight: 1,
      });
    }
  }

  return { nodes: [...nodes.values()], edges };
};

const extractEntities = (text: string): string[] => {
  const matches = text.match(/\b[A-Z][A-Za-z0-9-]{2,}\b/g) ?? [];
  return [...new Set(matches)].slice(0, 8);
};
