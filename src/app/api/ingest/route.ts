import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDocumentFromUrl } from "@/lib/document-loader";
import { embedText } from "@/lib/gemini";
import { buildGraph } from "@/lib/graphrag";
import { saveChunks, saveGraph } from "@/lib/storage";
import type { Chunk } from "@/lib/types";

const schema = z.object({
  documents: z
    .array(
      z.object({
        documentId: z.string(),
        title: z.string(),
        pages: z.array(z.string().min(1)),
      }),
    )
    .default([]),
  sourceUrls: z.array(z.string().url()).default([]),
  maxChunkChars: z.number().int().min(500).max(8000).default(1800),
});

const splitLongPage = (text: string, maxChunkChars: number) => {
  if (text.length <= maxChunkChars) {
    return [text];
  }

  const parts: string[] = [];
  for (let i = 0; i < text.length; i += maxChunkChars) {
    parts.push(text.slice(i, i + maxChunkChars));
  }
  return parts;
};

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  const docsFromUrls = await Promise.all(payload.sourceUrls.map((url) => loadDocumentFromUrl(url)));
  const allDocuments = [...payload.documents, ...docsFromUrls];

  const chunks: Chunk[] = [];
  const seenChunkHash = new Set<string>();

  for (const doc of allDocuments) {
    for (let i = 0; i < doc.pages.length; i += 1) {
      const pageParts = splitLongPage(doc.pages[i], payload.maxChunkChars);
      for (let j = 0; j < pageParts.length; j += 1) {
        const text = pageParts[j];
        const contentHash = createHash("sha1").update(text).digest("hex");
        if (seenChunkHash.has(contentHash)) {
          continue;
        }
        seenChunkHash.add(contentHash);

        const embedding = await embedText(text);
        const page = i + 1;

        chunks.push({
          id: `${doc.documentId}-${page}-${j + 1}`,
          documentId: doc.documentId,
          title: doc.title,
          page,
          text,
          embedding,
          sourceUrl: "sourceUrl" in doc ? doc.sourceUrl : undefined,
        });
      }
    }
  }

  await saveChunks(chunks);
  await saveGraph(buildGraph(chunks));

  return NextResponse.json({
    status: "ok",
    chunks: chunks.length,
    documents: allDocuments.length,
    deduplicated: seenChunkHash.size,
  });
}
