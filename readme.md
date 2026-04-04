# technocrats-innovation-challenge-Heisenbugs

AI-assisted dementia care app � helps patients recognise visitors
during video calls and reminds them to take medication.

## Team

| Dev | Role | Owns |
|-----|------|------|
| Dev 1 | ML / CV | ml-service/ |
| Dev 2 | Backend / SpacetimeDB | technocrats-innovation-challenge-Heisenbugs-db/ and bridge/ |
| Dev 3 | Frontend / LLM | frontend/ | LLM/

## Folder structure

- ml-service/     Dev 1 only - FastAPI + face recognition
- bridge/         Dev 2 only - connects ML to SpacetimeDB  
- technocrats-innovation-challenge-Heisenbugs-db/  Dev 2 only - all tables and reducers
- frontend/       Dev 3 only - React UI
- docs/           everyone reads, anyone can update

## Rule: never edit another devs folder.

## Run order (4 terminal tabs)

1. spacetime start
2. cd ml-service && uvicorn app.main:app --reload --port 8000
3. cd bridge && python bridge.py
4. cd frontend && npm run dev
