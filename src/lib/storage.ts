import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Chunk, GraphStore } from "@/lib/types";

const dbPath = process.env.ELSA_DATABASE_PATH ?? "./data/elsa.db";

const sqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

const runSql = (sql: string) => {
  execFileSync("sqlite3", [dbPath, sql], { stdio: "pipe" });
};

const queryJson = <T>(sql: string): T[] => {
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], { encoding: "utf8" });
  if (!output.trim()) {
    return [];
  }
  return JSON.parse(output) as T[];
};

const ensureSchema = async () => {
  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  runSql(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      title TEXT NOT NULL,
      page INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      source_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS graph_nodes (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      score REAL
    );

    CREATE TABLE IF NOT EXISTS graph_edges (
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      weight REAL NOT NULL,
      PRIMARY KEY (source_id, target_id, relation)
    );

    CREATE INDEX IF NOT EXISTS idx_chunks_document_page ON chunks(document_id, page);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_id);
    CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_id);
  `);

  const chunkColumns = queryJson<{ name: string }>("PRAGMA table_info(chunks);").map((c) => c.name);
  if (!chunkColumns.includes("source_url")) {
    runSql("ALTER TABLE chunks ADD COLUMN source_url TEXT;");
  }
};

export const saveChunks = async (chunks: Chunk[]) => {
  await ensureSchema();

  const statements = ["BEGIN;", "DELETE FROM chunks;"];
  for (const chunk of chunks) {
    const sourceUrlValue = chunk.sourceUrl ? sqlString(chunk.sourceUrl) : "NULL";
    statements.push(`
      INSERT INTO chunks (id, document_id, title, page, text, embedding, source_url)
      VALUES (
        ${sqlString(chunk.id)},
        ${sqlString(chunk.documentId)},
        ${sqlString(chunk.title)},
        ${chunk.page},
        ${sqlString(chunk.text)},
        ${sqlString(JSON.stringify(chunk.embedding))},
        ${sourceUrlValue}
      );
    `);
  }
  statements.push("COMMIT;");

  runSql(statements.join("\n"));
};

export const loadChunks = async (): Promise<Chunk[]> => {
  await ensureSchema();

  const rows = queryJson<{
    id: string;
    document_id: string;
    title: string;
    page: number;
    text: string;
    embedding: string;
    source_url: string | null;
  }>("SELECT id, document_id, title, page, text, embedding, source_url FROM chunks ORDER BY document_id, page;");

  return rows.map((row) => ({
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    page: Number(row.page),
    text: row.text,
    embedding: JSON.parse(row.embedding) as number[],
    sourceUrl: row.source_url ?? undefined,
  }));
};

export const saveGraph = async (graph: GraphStore) => {
  await ensureSchema();

  const statements = ["BEGIN;", "DELETE FROM graph_nodes;", "DELETE FROM graph_edges;"];

  for (const node of graph.nodes) {
    const score = typeof node.score === "number" ? node.score : "NULL";
    statements.push(`
      INSERT INTO graph_nodes (id, label, type, score)
      VALUES (${sqlString(node.id)}, ${sqlString(node.label)}, ${sqlString(node.type)}, ${score});
    `);
  }

  for (const edge of graph.edges) {
    statements.push(`
      INSERT INTO graph_edges (source_id, target_id, relation, weight)
      VALUES (
        ${sqlString(edge.from)},
        ${sqlString(edge.to)},
        ${sqlString(edge.relation)},
        ${edge.weight}
      );
    `);
  }

  statements.push("COMMIT;");
  runSql(statements.join("\n"));
};

export const loadGraph = async (): Promise<GraphStore> => {
  await ensureSchema();

  const nodes = queryJson<{
    id: string;
    label: string;
    type: "document" | "entity" | "concept";
    score: number | null;
  }>("SELECT id, label, type, score FROM graph_nodes;").map((node) => ({
    id: node.id,
    label: node.label,
    type: node.type,
    score: node.score ?? undefined,
  }));

  const edges = queryJson<{ source_id: string; target_id: string; relation: string; weight: number }>(
    "SELECT source_id, target_id, relation, weight FROM graph_edges;",
  ).map((edge) => ({
    from: edge.source_id,
    to: edge.target_id,
    relation: edge.relation,
    weight: Number(edge.weight),
  }));

  return { nodes, edges };
};

export const databaseStats = async () => {
  await ensureSchema();
  const [chunks] = queryJson<{ count: number }>("SELECT COUNT(*) AS count FROM chunks;");
  const [nodes] = queryJson<{ count: number }>("SELECT COUNT(*) AS count FROM graph_nodes;");
  const [edges] = queryJson<{ count: number }>("SELECT COUNT(*) AS count FROM graph_edges;");

  return {
    databasePath: dbPath,
    chunks: Number(chunks?.count ?? 0),
    nodes: Number(nodes?.count ?? 0),
    edges: Number(edges?.count ?? 0),
  };
};
