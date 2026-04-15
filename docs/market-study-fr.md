# Étude de marché (2026) — Applications RAG pertinentes pour ELSA

## Méthode
- Benchmark orienté **solutions prêtes entreprise** + **stack open source composable**.
- Critères: multimodalité, traçabilité source/page, orchestration, passage à l'échelle documentaire.

## Concurrents/plateformes à surveiller
1. **Google Vertex AI RAG Engine + Gemini**
   - Fort pour écosystème Google Cloud, intégration native Gemini.
2. **Azure AI Search + Azure OpenAI**
   - Mature côté sécurité/entreprise et connecteurs M365.
3. **AWS Bedrock Knowledge Bases**
   - Intégration AWS forte, ingestion managée.
4. **Elastic Search AI Platform**
   - RAG adossé à un moteur search robuste, observabilité sécurité.
5. **Pinecone + framework applicatif (LangChain/LlamaIndex)**
   - Bonne vitesse de prototypage pour MVP orienté forfait.

## Recommandation pour la mission courte
- **Front**: Next.js (démonstrateur rapide).
- **Backend léger**: API Routes Next.js + stockage JSON/objet puis migration DB vectorielle.
- **GraphRAG open source**: couche graphe explicite (entités + liens) pour expliquer le cheminement.
- **Orchestration**: boucle draft → critic pour challenger la réponse et éviter les hallucinations.

## Sources primaires
- Google Cloud Vertex AI RAG Engine: https://cloud.google.com/vertex-ai/generative-ai/docs/rag-overview
- Gemini API / embeddings: https://ai.google.dev/gemini-api/docs/embeddings
- Azure AI Search RAG pattern: https://learn.microsoft.com/azure/search/retrieval-augmented-generation-overview
- AWS Bedrock Knowledge Bases: https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html
- Elastic AI platform: https://www.elastic.co/enterprise-search/ai-search
- Pinecone docs RAG: https://docs.pinecone.io/guides/get-started/build-a-rag-chatbot
