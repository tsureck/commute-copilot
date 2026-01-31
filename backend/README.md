# Commute Copilot Backend

Backend infrastructure for the Commute Copilot decision engine using **Google Gemini**, **n8n**, **ElevenLabs**, and **Supabase**.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Frontend  │─────▶│  Node.js API │─────▶│  n8n Workflows  │
│  (Mobile)   │      │   (Express)  │      │  (Orchestration)│
└─────────────┘      └──────────────┘      └─────────────────┘
                            │                        │
                            │                        │
                            ▼                        ▼
                    ┌──────────────┐      ┌─────────────────┐
                    │   Supabase   │      │  Gemini API     │
                    │  (Postgres)  │      │  (Reasoning)    │
                    └──────────────┘      └─────────────────┘
                                                    │
                                                    ▼
                                          ┌─────────────────┐
                                          │  transport.rest │
                                          │  Open-Meteo     │
                                          └─────────────────┘
```

**Components:**

1. **n8n** (orchestration): Scheduled checks + decision generation + user reply handling
2. **Gemini API** (reasoning): LLM-based decision logic (replaces manual if/else rules)
3. **Node.js API** (lightweight): GET /decision/:id, POST /decision, POST /decision/:id/reply
4. **Supabase** (database): Store decisions, user preferences
5. **transport.rest** (data): Real-time Hamburg ↔ Bremen train status
6. **Open-Meteo** (data): Weather forecast (rain detection)
7. **ElevenLabs** (voice): Text-to-speech (called by frontend)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- n8n account ([n8n.cloud](https://n8n.cloud) free tier)
- Google AI API key ([AI Studio](https://makersuite.google.com/app/apikey))
- Supabase account ([supabase.com](https://supabase.com) free tier)

### 1. Database Setup

```bash
# Create Supabase project at supabase.com
# Run the SQL schema
cd backend/database
# Copy schema.sql contents and run in Supabase SQL Editor
```

### 2. n8n Workflows

```bash
# Sign up at n8n.cloud (or self-host with Docker)
# Import workflows from backend/n8n/
# See backend/n8n/README.md for detailed setup
```

Key steps:
1. Create n8n account
2. Add credentials (Gemini API, Supabase)
3. Import Workflow B (on-demand decision)
4. Activate workflow, copy webhook URL
5. Add webhook URL to API `.env`

### 3. API Setup

```bash
cd backend/api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials (see below)

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

### 4. Test the Stack

```bash
# Health check
curl http://localhost:3000/health

# Generate decision (calls n8n → Gemini → Supabase)
curl -X POST http://localhost:3000/decision \
  -H "Content-Type: application/json" \
  -d '{
    "route": {
      "from": "Hamburg Hbf",
      "to": "Bremen Hbf",
      "preferredLine": "RE4"
    },
    "userContext": {
      "homeOfficeAllowed": true,
      "nextMeetingLocalTime": "10:30",
      "avoidWaitingOutdoors": true
    }
  }'

# Fetch decision by ID
curl http://localhost:3000/decision/dec_abc123
```

## Environment Variables

### API (.env in backend/api/)

```bash
# Server
PORT=3000
NODE_ENV=development

# n8n Webhooks (from n8n workflow URLs)
N8N_WEBHOOK_BASE_URL=https://your-n8n.app.n8n.cloud/webhook
N8N_DECISION_WEBHOOK=/decision
N8N_REPLY_WEBHOOK=/reply

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Demo mode (uses mocked data instead of live APIs)
DEMO_MODE=false
```

### n8n (in n8n Settings → Environment Variables)

```bash
GEMINI_API_KEY=your-google-ai-key-from-ai-studio
DEMO_MODE=false
```

## Project Structure

```
backend/
├── api/                      # Node.js Express API
│   ├── src/
│   │   ├── index.ts          # Main server
│   │   ├── routes/
│   │   │   ├── decision.ts   # POST /decision, GET /decision/:id, POST /:id/reply
│   │   │   └── health.ts     # GET /health
│   │   ├── services/
│   │   │   └── n8n.ts        # n8n webhook caller
│   │   └── db/
│   │       └── index.ts      # Supabase client
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── n8n/                      # n8n workflow templates
│   ├── README.md             # n8n setup guide
│   └── workflow-b-ondemand-template.md  # Detailed node configurations
│
├── database/
│   └── schema.sql            # Postgres schema for Supabase
│
├── gemini/
│   └── prompts.ts            # Gemini prompt templates
│
├── use_case_1_example/       # Interface contracts
│   ├── contracts.ts          # TypeScript types (shared with frontend)
│   ├── API.md                # API documentation
│   └── [agent|db-api]/       # Example JSON payloads
│
└── README.md                 # This file
```

## API Endpoints

### POST /decision

On-demand decision generation. Triggers n8n Workflow B.

**Request:**
```json
{
  "route": { "from": "Hamburg Hbf", "to": "Bremen Hbf", "preferredLine": "RE4" },
  "userContext": {
    "homeOfficeAllowed": true,
    "nextMeetingLocalTime": "10:30",
    "avoidWaitingOutdoors": true
  }
}
```

**Response:** `AgentDecision` (see [contracts.ts](use_case_1_example/contracts.ts))

### GET /decision/:id

Fetch stored decision from database.

**Response:** `AgentDecision`

### POST /decision/:id/reply

User reply with constraints (e.g. "I want to leave 2h later").

**Request:**
```json
{
  "replyType": "modify",
  "userMessage": "I want to leave at least two hours later",
  "modifyConstraints": { "minDepartureDelayMinutes": 120 }
}
```

**Response:**
- `204 No Content` for accept/reject
- `200 OK` with new `AgentDecision` for modify

### GET /health

Health check. Returns database and n8n configuration status.

## Development

```bash
cd backend/api

# Install dependencies
npm install

# Run with auto-reload
npm run dev

# Lint
npm run lint

# Build
npm run build
```

## Deployment

### API (Railway / Render)

1. Create new project on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect GitHub repo
3. Set environment variables (from .env.example)
4. Deploy

### n8n

- **Cloud**: Already deployed at n8n.cloud (always running)
- **Self-hosted**: Deploy Docker container on Railway/Render

### Database

- Supabase free tier (always running, 500 MB)

## Testing

### Demo Mode

For testing without live APIs, set `DEMO_MODE=true`:

```bash
# In API .env
DEMO_MODE=true

# In n8n environment
DEMO_MODE=true
```

This uses mocked data from `use_case_1_example/db-api/answer.json` (cancelled RE4 at 07:34, delayed at 08:06, on-time at 08:34).

### Manual Testing

```bash
# Test transport.rest API
curl "https://v6.db.transport.rest/journeys?from=8002549&to=8000050&results=3"

# Test Open-Meteo
curl "https://api.open-meteo.com/v1/forecast?latitude=53.55&longitude=9.99&hourly=precipitation"

# Test Gemini (requires API key)
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

## Troubleshooting

### Gemini returns invalid JSON

- Check prompt in `backend/gemini/prompts.ts`
- Test prompt in [AI Studio](https://makersuite.google.com/app/prompts)
- Ensure `response_mime_type: "application/json"` is set in n8n HTTP Request

### n8n workflow times out

- Increase execution timeout in n8n settings (default 120s)
- Check n8n logs for errors
- Verify credentials (Gemini API key, Supabase password)

### API returns 500

- Check API logs: `npm run dev`
- Verify n8n webhook URL in `.env`
- Test n8n webhook directly with curl

## Cost Estimate (Free Tiers)

| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| n8n Cloud | 5,000 executions/month | ~1,000 decisions/day |
| Google Gemini | 60 req/min, 1,500/day | Demo + testing |
| Supabase | 500 MB DB, 2 GB bandwidth | Unlimited for MVP |
| Railway/Render | 500 hours/month | Always-on API |
| transport.rest | Free, no key | Unlimited |
| Open-Meteo | Free | Unlimited |

Total: **$0** for hackathon demo and MVP testing.

## Next Steps

1. ✅ Database schema created
2. ✅ API scaffolded
3. ✅ n8n workflow templates documented
4. 🔲 Import Workflow B into n8n
5. 🔲 Test decision generation with real Hamburg → Bremen data
6. 🔲 Connect frontend to API
7. 🔲 Add Workflow A (scheduled checks)
8. 🔲 Add push notifications

See [backend/n8n/README.md](n8n/README.md) for n8n workflow setup.

See [use_case_1_example/API.md](use_case_1_example/API.md) for detailed API contract.
