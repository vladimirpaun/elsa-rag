import { NextResponse } from "next/server";
import { z } from "zod";
import { answerWithReflection } from "@/lib/orchestrator";

const schema = z.object({
  questionnaire: z.array(
    z.object({
      question: z.string(),
      expectedKeywords: z.array(z.string()).default([]),
    }),
  ),
});

export async function POST(request: Request) {
  const payload = schema.parse(await request.json());

  let score = 0;
  const details = [];

  for (const item of payload.questionnaire) {
    const answer = await answerWithReflection(item.question);
    const lower = answer.answer.toLowerCase();
    const hits = item.expectedKeywords.filter((k) => lower.includes(k.toLowerCase())).length;
    const itemScore = item.expectedKeywords.length > 0 ? hits / item.expectedKeywords.length : 0.5;
    score += itemScore;
    details.push({
      question: item.question,
      answer: answer.answer,
      score: Number((itemScore * 20).toFixed(2)),
      sources: answer.sources,
    });
  }

  const normalized = payload.questionnaire.length === 0 ? 0 : (score / payload.questionnaire.length) * 20;
  const target = Number(process.env.EVAL_TARGET_SCORE ?? 18);

  return NextResponse.json({
    globalScore: Number(normalized.toFixed(2)),
    pass: normalized >= target,
    target,
    details,
  });
}
