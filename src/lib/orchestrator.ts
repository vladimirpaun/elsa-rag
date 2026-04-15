import { StateGraph } from "langgraph";
import { embedText, getGeminiClient } from "@/lib/gemini";
import { chunkToSource, topKChunks } from "@/lib/retrieval";
import { loadChunks } from "@/lib/storage";
import type { QueryAnswer } from "@/lib/types";

type QueryState = {
  question: string;
  answerDraft: string;
  confidence: number;
  reasoning: string[];
  clarification?: string[];
};

const askModel = async (question: string, context: string) => {
  const client = getGeminiClient();
  const prompt = `You are a refrigeration field assistant.\nQuestion: ${question}\nContext:\n${context}\n\nRules: if uncertain, say you do not know. Ask for model/version if ambiguous. Return concise answer.`;
  const result = await client.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
  });
  return result.text ?? "Je ne sais pas.";
};

export const answerWithReflection = async (question: string): Promise<QueryAnswer> => {
  const chunks = await loadChunks();
  if (chunks.length === 0) {
    return {
      answer: "Base documentaire vide. Lancez l'ingestion avant de poser des questions.",
      confidence: 0,
      sources: [],
      reasoningTrace: ["no_data"],
    };
  }

  const embedding = await embedText(question);
  const topChunks = topKChunks(embedding, chunks);
  const context = topChunks.map((c) => `[${c.title} p.${c.page}] ${c.text}`).join("\n\n");

  const graph = new StateGraph<QueryState>({
    channels: {
      question: null,
      answerDraft: null,
      confidence: null,
      reasoning: null,
      clarification: null,
    },
  });

  graph.addNode("draft", async (state) => {
    const answer = await askModel(state.question, context);
    const confidence = answer.toLowerCase().includes("je ne sais") ? 0.2 : 0.72;
    const clarification = /mod[eè]le|version|s[ée]rie/i.test(state.question)
      ? undefined
      : ["Pouvez-vous préciser le modèle exact ?", "Avez-vous la version de l'équipement ?"];
    return {
      ...state,
      answerDraft: answer,
      confidence,
      clarification,
      reasoning: [...state.reasoning, "draft_generated"],
    };
  });

  graph.addNode("critic", async (state) => {
    const improved = state.answerDraft.length < 30 ? "Je ne sais pas avec certitude selon la base actuelle." : state.answerDraft;
    const confidence = Math.min(0.95, state.confidence + 0.08);
    return {
      ...state,
      answerDraft: improved,
      confidence,
      reasoning: [...state.reasoning, "self_critic_applied"],
    };
  });

  graph.setEntryPoint("draft");
  graph.addEdge("draft", "critic");
  graph.setFinishPoint("critic");

  const app = graph.compile();
  const result = await app.invoke({
    question,
    answerDraft: "",
    confidence: 0,
    reasoning: ["query_received"],
  });

  return {
    answer: result.answerDraft,
    confidence: result.confidence,
    clarification: result.clarification,
    sources: topChunks.map(chunkToSource),
    reasoningTrace: result.reasoning,
  };
};
