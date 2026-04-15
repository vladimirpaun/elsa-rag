import { Chat } from "@/components/chat";

export default function HomePage() {
  return (
    <main className="container">
      <h1>ELSA — GraphRAG Simulator</h1>
      <p>
        Ingestion de documents techniques, extraction multimodale, et orchestration réflexive
        pour viser un score de 18/20 sur questionnaire métier.
      </p>
      <Chat />
    </main>
  );
}
