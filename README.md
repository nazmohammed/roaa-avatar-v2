# roaa-avatar-prototype

**ROAA** — Riyadh Air Oasis for Analytics and AI

A voice-interactive cabin-crew avatar prototype that:
- Listens to spoken questions via Azure Speech-to-Text
- Matches intent against 6 scripted Q&A pairs
- Responds with Azure Neural TTS and real-time viseme lip-sync
- Renders a 3D avatar (Three.js / Meshy.ai) with speaking animations

## Architecture

- **Frontend**: React + Vite + TypeScript, React Three Fiber, Azure Speech SDK
- **Backend**: Python FastAPI (token proxy, keyword intent matcher)

## Quick Start

```bash
# Backend
cd server
pip install -r requirements.txt
cp .env.example .env   # add your Azure Speech key
uvicorn app.main:app --port 3001

# Frontend
cd client
npm install
npm run dev
```

## Environment Variables

See `.env.example` for required Azure Speech credentials.
