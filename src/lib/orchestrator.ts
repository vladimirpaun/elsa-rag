import { StateGraph } from "langgraph";
import { embedText, getGeminiClient, getGenerationModel } from "@/lib/gemini";
import { chunkToSource, rankChunks } from "@/lib/retrieval";
import { loadChunks, loadGraph } from "@/lib/storage";
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
  const prompt = `You are a refrigeration field assistant.\nQuestion: ${question}\nContext:\n${context}\n\nRules:\n- If uncertain, answer exactly: Je ne sais pas.\n- Ask for model/version if ambiguous.\n- Cite source title and page in prose.`;
  const result = await client.models.generateContent({
    model: getGenerationModel(),
    contents: prompt,
  });
  return result.text ?? "Je ne sais pas.";
};

const graphHintsForDocuments = async (documentIds: string[]) => {
  const graph = await loadGraph();
  const hints: string[] = [];

  for (const id of documentIds) {
    const links = graph.edges
      .filter((edge) => edge.from === id && edge.relation === "mentions")
      .slice(0, 6)
      .map((edge) => edge.to.replace("entity:", ""));
    if (links.length > 0) {
      hints.push(`${id}: ${links.join(", ")}`);
    }
  }

  return hints;
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
  const ranked = rankChunks(question, embedding, chunks);
  const topRanked = ranked.slice(0, 5);
  const topChunks = topRanked.map((item) => item.chunk);
  const avgScore = topRanked.reduce((acc, item) => acc + item.score, 0) / Math.max(1, topRanked.length);

  const graphHints = await graphHintsForDocuments(topChunks.map((chunk) => chunk.documentId));
  const context = [
    ...topChunks.map((c) => `[${c.title} p.${c.page}] ${c.text}`),
    graphHints.length ? `Graph hints:\n${graphHints.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

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
    const confidence = answer.toLowerCase().includes("je ne sais") ? 0.2 : Math.min(0.9, 0.45 + avgScore);
    const clarification = /mod[eè]le|version|s[ée]rie/i.test(state.question)
      ? undefined
      : ["Pouvez-vous préciser le modèle exact ?", "Avez-vous la version de l'équipement ?"];

    return {
      ...state,
      answerDraft: answer,
      confidence,
      clarification,
      reasoning: [...state.reasoning, `draft_generated(avg_similarity=${avgScore.toFixed(3)})`],
    };
  });

  graph.addNode("critic", async (state) => {
    const lowSignal = avgScore < 0.38;
    const improved =
      lowSignal || state.answerDraft.length < 30
        ? "Je ne sais pas avec certitude selon la base documentaire actuelle."
        : state.answerDraft;
    const confidence = lowSignal ? 0.15 : Math.min(0.95, state.confidence + 0.06);

    return {
      ...state,
      answerDraft: improved,
      confidence,
      reasoning: [...state.reasoning, lowSignal ? "critic_low_retrieval_signal" : "self_critic_applied"],
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
    reasoningTrace: [...result.reasoning, `graph_hints=${graphHints.length}`],
  };
};
