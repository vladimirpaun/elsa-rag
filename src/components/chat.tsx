"use client";

import { useState } from "react";
import type { QueryAnswer } from "@/lib/types";

export const Chat = () => {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryAnswer | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as QueryAnswer;
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Simulateur Q&R technicien</h2>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Posez une question technique..." />
      <button disabled={loading || !question.trim()} onClick={onSubmit}>
        {loading ? "Analyse..." : "Interroger l'IA"}
      </button>

      {result ? (
        <div className="answer">
          <p><strong>Réponse:</strong> {result.answer}</p>
          <p><strong>Confiance:</strong> {(result.confidence * 100).toFixed(1)}%</p>
          {result.clarification?.length ? (
            <ul>
              {result.clarification.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          ) : null}
          <h3>Sources</h3>
          <ul>
            {result.sources.map((s) => (
              <li key={`${s.documentId}-${s.page}`}>{s.title} — page {s.page}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};
