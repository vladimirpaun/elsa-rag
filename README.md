# ELSA RAG Simulator (Next.js + Gemini + GraphRAG)

Prototype pour démontrer une capacité à répondre à un questionnaire technicien sur base documentaire (manuels, docs formation, interventions).

## Ce que fait ce prototype
- Ingestion de documents paginés via `/api/ingest`.
- Ingestion depuis URL (dont PDF) via `sourceUrls` et extraction texte HTTP.
- Embeddings Gemini (`gemini-embedding-001` par défaut, configurable) pour retrieval.
- Génération pilotée par `GEMINI_GENERATION_MODEL` (défaut: `gemini-3-pro-preview`).
- Persistance en base SQLite (`ELSA_DATABASE_PATH`) pour chunks vectorisés et knowledge graph.
- Construction d'un graphe léger (documents ↔ entités) pour GraphRAG explicable.
- Orchestration réflexive (draft + critic) via LangGraph avec garde-fou “je ne sais pas” sur faible signal de retrieval.
- API d'évaluation `/api/evaluate` qui calcule une note /20 sur questionnaire.
- Endpoint de santé embeddings `/api/health/embeddings`.
- Endpoint de stats `/api/admin/stats` pour vérifier le volume indexé.
- UI Next.js avec affichage des sources, pages, liens et trace d'orchestration.

## Lancement
1. Copier `.env.example` vers `.env`, renseigner `GOOGLE_API_KEY` et ajuster `GEMINI_GENERATION_MODEL` si besoin.
2. Installer les dépendances:
   ```bash
   npm install
   ```
3. Lancer le serveur:
   ```bash
   npm run dev
   ```

## Test rapide avec le PDF fourni
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceUrls": [
      "https://digitel.swiss/wp-content/uploads/2022/02/Digitel-regulation-CO2-transcritique-FR.pdf"
    ]
  }'

curl http://localhost:3000/api/admin/stats
curl http://localhost:3000/api/health/embeddings

curl -X POST http://localhost:3000/api/query \
  -H 'Content-Type: application/json' \
  -d '{"question":"Quel est le principe de régulation CO2 transcritique ?"}'
```

## Limites connues (à traiter en batch 2+)
- SQLite est utilisé pour une persistance locale robuste, mais pas encore un cluster vector DB distribué.
- Extraction PDF via proxy HTTP texte (à remplacer par parsing multimodal natif Gemini Files API).
- Score 18/20 à valider avec un jeu de test métier réel (1000 docs x 200 pages).
- Deep links page PDF à implémenter dans un viewer documentaire.
