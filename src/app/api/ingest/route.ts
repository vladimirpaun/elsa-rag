import { NextResponse } from "next/server";
import { z } from "zod";
import { embedText } from "@/lib/gemini";
import { buildGraph } from "@/lib/graphrag";
import { saveChunks, saveGraph } from "@/lib/storage";
import type { Chunk } from "@/lib/types";

const schema = z.object({
  documents: z.array(
    z.object({
      documentId: z.string(),
      title: z.string(),
      pages: z.array(z.string().min(1)),
    }),
  ),
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  const chunks: Chunk[] = [];
  for (const doc of payload.documents) {
    for (let i = 0; i < doc.pages.length; i += 1) {
      const text = doc.pages[i];
      const embedding = await embedText(text);
      chunks.push({
        id: `${doc.documentId}-${i + 1}`,
        documentId: doc.documentId,
        title: doc.title,
        page: i + 1,
        text,
        embedding,
      });
    }
  }

  await saveChunks(chunks);
  await saveGraph(buildGraph(chunks));

  return NextResponse.json({ status: "ok", chunks: chunks.length });
}
