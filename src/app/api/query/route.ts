import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithReflection } from "@/lib/orchestrator";

const schema = z.object({ question: z.string().min(2) });

export async function POST(request: Request) {
  const { question } = schema.parse(await request.json());
  const result = await answerWithReflection(question);
  return NextResponse.json(result);
}
