# Setup Guide

## Everyone runs this first

  git clone https://github.com/YOUR_ORG/technocrats-innovation-challenge-Heisenbugs.git
  cd technocrats-innovation-challenge-Heisenbugs

---

## Dev 2 - SpacetimeDB setup (you)

Install SpacetimeDB CLI:
  winget install SpacetimeDB.SpacetimeDB

Start the local server (keep this terminal open always):
  spacetime start

Publish your module:
  cd technocrats-innovation-challenge-Heisenbugs-db
  spacetime publish --anonymous technocrats-innovation-challenge-Heisenbugs-db

Watch logs:
  spacetime logs technocrats-innovation-challenge-Heisenbugs-db --follow

Run the bridge:
  cd bridge
  pip install -r requirements.txt
  copy .env.example .env
  python bridge.py

---

## Dev 1 - ML service setup

  cd ml-service
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  copy .env.example .env
  uvicorn app.main:app --reload --port 8000

Check: http://localhost:8000/health should return ok

---

## Dev 3 - Frontend setup

  cd frontend
  npm install
  copy .env.example .env
  npm run dev

Check: http://localhost:5173
