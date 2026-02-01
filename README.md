# Commute Copilot

Commute Copilot is an AI decision agent that tells you when to commute, wait, or work from home using real-time transit, weather, and calendar context.

## How It Works

1. **Monitors your route** — checks live train status, weather, and your calendar every 5 minutes (6–10 AM)
2. **Sends a push notification** when something changes — with a clear recommendation, not just raw delay data
3. **Speaks the reasoning** — tap play to hear why the AI recommends what it does
4. **Voice follow-ups** — ask questions like "Can I still make my 10 AM meeting?" and get a spoken, context-aware answer
5. **Consistent reasoning** — all follow-ups reference the same data snapshot ("store once, reason many times")

## Tech Stack

| Component | Technology |
|-----------|------------|
| Mobile App | React Native, Expo 54, TypeScript |
| AI Reasoning | Google Gemini 2.5 Flash |
| Voice | ElevenLabs (STT via Scribe, TTS via Matilda) |
| Orchestration | n8n workflows |
| Database | Supabase (PostgreSQL) |
| Live Data | transport.rest (DB trains), Open-Meteo (weather) |

## How to Run

```bash
cd mobile_app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Architecture

```
Mobile App (Expo)
    │
    │
    └─ Voice Chat ─┬─► ElevenLabs Bridge (FastAPI) ── STT/TTS
                   │
                   └─► n8n Webhooks ─┬─► transport.rest (trains)
                                     ├─► Open-Meteo (weather)
                                     ├─► Google Calendar
                                     ├─► Gemini (LLM reasoning)
                                     └─► Supabase (store context + decisions)
```

**Key design principle:** When a decision is requested, n8n fetches external data once and stores it in `context_snapshots`. All follow-up questions reason over the stored snapshot — no re-fetching, consistent answers.

## Decision Types

The AI produces one of four actions:

| Action | When |
|--------|------|
| `LEAVE_NOW` | Your train is on time, go catch it |
| `LEAVE_EARLIER_THAN_USUAL` | Disruptions ahead, beat them by leaving early |
| `WAIT_AND_LEAVE_LATER` | Current trains disrupted, a later one is reliable |
| `WORK_FROM_HOME_TEMPORARILY` | Major disruption, stay home until it clears |

