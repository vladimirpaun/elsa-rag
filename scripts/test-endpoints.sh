#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

curl -sS -X POST "$BASE_URL/api/ingest" \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceUrls": [
      "https://digitel.swiss/wp-content/uploads/2022/02/Digitel-regulation-CO2-transcritique-FR.pdf"
    ]
  }' | jq .

curl -sS "$BASE_URL/api/health/embeddings" | jq .

curl -sS "$BASE_URL/api/admin/stats" | jq .

curl -sS -X POST "$BASE_URL/api/query" \
  -H 'Content-Type: application/json' \
  -d '{"question":"Comment est calculée la consigne de haute pression ?"}' | jq .

curl -sS -X POST "$BASE_URL/api/evaluate" \
  -H 'Content-Type: application/json' \
  -d '{
    "questionnaire": [
      {
        "question": "Quel paramètre active la récupération de chaleur ?",
        "expectedKeywords": ["C2", "récupération"]
      }
    ]
  }' | jq .
