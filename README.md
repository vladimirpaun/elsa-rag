# ELSA RAG Simulator (Next.js + Gemini + GraphRAG)

Prototype pour démontrer une capacité à répondre à un questionnaire technicien sur base documentaire (manuels, docs formation, interventions).

## Ce que fait ce prototype
- Ingestion de documents paginés via `/api/ingest`.
- Embeddings Gemini (`gemini-embedding-001`) pour retrieval.
- Construction d'un graphe léger (documents ↔ entités) pour GraphRAG explicable.
- Orchestration réflexive (draft + critic) via LangGraph pour améliorer la réponse.
- API d'évaluation `/api/evaluate` qui calcule une note /20 sur questionnaire.
- UI Next.js minimaliste pour simulation Q&A.

## Lancement
1. Copier `.env.example` vers `.env` et renseigner `GOOGLE_API_KEY`.
2. Installer les dépendances:
   ```bash
   npm install
   ```
3. Lancer le serveur:
   ```bash
   npm run dev
   ```
4. Ingestion exemple:
   ```bash
   curl -X POST http://localhost:3000/api/ingest \
     -H 'Content-Type: application/json' \
     --data @docs/sample-documents.json
   ```

## Limites connues (à traiter en batch 2+)
- Persistance JSON locale (à migrer vers vectordb + object storage).
- Extraction multimodale image native à brancher (PDF + image chunks).
- Score 18/20 à valider avec un jeu de test métier réel (1000 docs x 200 pages).
- Deep links page PDF à implémenter dans un viewer documentaire.
