# Audit rigoureux GraphRAG (ELSA) — Avril 2026

## 1) État actuel
- ✅ Ingestion multi-source + embeddings Gemini.
- ✅ Persistance SQLite des chunks vectorisés et du graphe.
- ✅ Orchestration LangGraph (`draft -> critic`) avec garde-fou "Je ne sais pas".
- ✅ Endpoints d'observabilité (`/api/health/embeddings`, `/api/admin/stats`).

## 2) Bonnes pratiques internet retenues
1. **Pipeline RAG en couches (ingestion, indexation, retrieval, grounding, eval)**
   - Source: LangChain/LangGraph docs (architecture d'agents et workflows robustes).
2. **Approche GraphRAG explicable**
   - Source: Microsoft GraphRAG (construction de communautés/entités, réponse avec contexte structuré).
3. **Multimodalité documents (PDF/images) côté Gemini**
   - Source: Gemini API docs (models/files/embeddings).
4. **Hybrid retrieval dense + lexical**
   - Recommandé par la pratique industrielle (vector + sparse) pour réduire les trous de rappel.

## 3) Améliorations implémentées dans ce batch
- Retrieval hybride **dense + lexical** avec fusion de score pour améliorer la pertinence sur 1000+ documents.
- Ingestion renforcée : chunking configurable + déduplication des chunks identiques (hash SHA1).
- Modèle de génération configurable et orienté modèle puissant (`GEMINI_GENERATION_MODEL`).

## 4) Gaps restants pour un vrai mode “best-in-class”
- Vector DB distribuée (Qdrant/pgvector/Weaviate) + index HNSW à la place de SQLite local.
- Parsing PDF/images natif (Gemini Files API) au lieu du proxy texte.
- Graphe de production (Neo4j) + requêtes de voisinage/communautés.
- Evaluation continue: jeux de tests versionnés + golden set + scorecards (Recall@k, groundedness, exactitude).
- Guardrails sécurité: PII redaction, policy checks, provenance stricte par source/page.

## 5) Plan recommandé (3 sprints)
- Sprint 1: Qdrant + Neo4j + benchmark retrieval (dense vs hybrid).
- Sprint 2: ingestion multimodale native (PDF + images) + citations deep-link page.
- Sprint 3: agentic evaluation loop + tableau de bord qualité pour viser 18+/20 durable.

## Sources
- Gemini API docs (models): https://ai.google.dev/gemini-api/docs/models/experimental-models
- Gemini API docs (embeddings): https://ai.google.dev/gemini-api/docs/embeddings
- LangGraph docs: https://docs.langchain.com/langgraph
- Microsoft GraphRAG: https://github.com/microsoft/graphrag
- Neo4j GraphRAG guide: https://go.neo4j.com/rs/710-RRC-335/images/Developers-Guide-GraphRAG.pdf
