# n8n Workflows for Commute Copilot

This directory contains n8n workflow configurations and documentation for the Commute Copilot backend orchestration.

## Overview

n8n handles the heavy lifting:
- **Workflow A (Scheduled)**: Checks every 5 minutes for disruptions during commute hours
- **Workflow B (On-demand)**: Generates decision when user requests via API
- **Workflow C (User Reply)**: Handles user feedback and constraint modifications

## Setup

### 1. Create n8n Account

- **Cloud**: Sign up at [n8n.cloud](https://n8n.cloud) (free tier: 5,000 executions/month)
- **Self-hosted**: Run with Docker: `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`

### 2. Configure Credentials

In n8n UI, go to **Credentials** and add:

#### Google Gemini API
- Name: `Gemini API`
- API Key: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Free tier: 60 requests/min

#### Supabase
- Name: `Supabase`
- Host: `db.your-project.supabase.co`
- Database: `postgres`
- User: `postgres`
- Password: from Supabase project settings
- Port: `5432`

### 3. Import Workflows

**Option A: Import JSON file (recommended)**

1. In n8n: Click **Workflows** → **Add Workflow** → **Import from File**
2. Select `workflow-b-ondemand.json` from this folder
3. Click **Save**
4. **Add your Gemini API key**: Go to n8n **Settings** → **Environment Variables** → Add `GEMINI_API_KEY`
5. Click **Activate** (toggle in top-right)
6. Click the **Webhook** node → copy the webhook URL (e.g. `https://your-n8n.app.n8n.cloud/webhook/abc123/decision`)
7. Add to your API `.env` as `N8N_WEBHOOK_BASE_URL` (the base part before `/decision`)

**Option B: Import from URL**

1. In n8n: **Workflows** → **Import from URL**
2. Paste: `https://raw.githubusercontent.com/YOUR_REPO/backend/n8n/workflow-b-ondemand.json`

**Files available:**
- `workflow-b-ondemand.json` - On-demand decision with demo mode support

## Workflow Details

### Workflow B: On-Demand Decision (MVP)

**Trigger**: Webhook `/decision`

**Input**:
```json
{
  "route": { "from": "Hamburg Hbf", "to": "Bremen Hbf", "preferredLine": "RE4" },
  "userContext": {
    "homeOfficeAllowed": true,
    "nextMeetingLocalTime": "10:30",
    "avoidWaitingOutdoors": true
  },
  "timeNow": "2026-01-31T07:10:00+01:00"
}
```

**Demo Mode (default: ON)**

By default, the workflow runs in **demo mode** to avoid API calls:
- Uses mock transport data (Use Case 1: cancelled RE4 at 07:34, delayed at 08:06, on-time at 08:34)
- Uses mock weather data (rain)
- Uses mock calendar data (meeting at 10:30)
- Returns mock decision (WORK_FROM_HOME_TEMPORARILY)
- Skips Gemini API call

To switch to live mode, set `DEMO_MODE=false` in n8n Environment Variables.

**Architecture**:

```
Webhook (POST /decision)
    │
    ▼
Demo Mode? ─────────────────────────────────────┐
    │ (true)                                    │ (false)
    ▼                                           ▼
┌──────────────────┐                   ┌──────────────────┐
│ Mock Transport   │                   │ Live Transport   │
│ Mock Weather     │                   │ Live Weather     │
│ Mock Calendar    │                   │                  │
└────────┬─────────┘                   └────────┬─────────┘
         │                                      │
         ▼                                      ▼
┌──────────────────────────────────────────────────────┐
│              CONVERSION LOGIC                        │
│  • Convert Transport Data → SimplifiedConnections    │
│  • Convert Weather Data → WeatherForecast            │
│  • Convert Calendar Data → nextMeetingLocalTime      │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │  Build AgentInfo│
              └────────┬───────┘
                       │
                       ▼
              Skip Gemini? ──────────────────┐
                  │ (demo)                   │ (live)
                  ▼                          ▼
         ┌────────────────┐         ┌────────────────┐
         │ Mock Decision  │         │ Gemini API     │
         │ (Use Case 1)   │         │ → Parse        │
         └────────┬───────┘         └────────┬───────┘
                  │                          │
                  └──────────┬───────────────┘
                             ▼
                      ┌────────────┐
                      │  Respond   │
                      └────────────┘
```

**Conversion Logic (included in workflow)**:

1. **Convert Transport Data**: Raw transport.rest response → `ConnectionsAnswer` + `SimplifiedConnections`
2. **Convert Weather Data**: Raw Open-Meteo response → `WeatherForecast` (rainStartsLocalTime, condition)
3. **Convert Calendar Data**: Raw calendar response → `nextMeetingLocalTime`, `hasMeetingsToday`

**Steps (with conversion)**:
1. Demo Mode? → Route to mock or live data
2. Get data (mock or live: transport, weather, calendar)
3. **Convert Transport Data** → SimplifiedConnections format
4. **Convert Weather Data** → WeatherForecast format
5. **Convert Calendar Data** → Meeting time extraction
6. **Build AgentInfo** → Merge all data sources
7. Skip Gemini? → Demo returns mock decision, Live calls Gemini
8. (Live only) Call Gemini API → Parse response
9. Respond → Return AgentDecision JSON

**Output**: AgentDecision matching contracts.ts

**Note**: Database storage is not included in the demo workflow. Add Postgres node after step 8 when ready.

See `workflow-b-ondemand-template.md` for additional node configuration details.

### Workflow A: Scheduled Check (Phase 2)

**Trigger**: Cron `*/5 7-9 * * 1-5` (every 5 min, 7-9 AM, weekdays)

**Steps**: Same as Workflow B, plus:
- Fetch previous decision from DB
- Compare decision types (WORK_FROM_HOME_TEMPORARILY vs LEAVE_NOW)
- If changed: send push notification via FCM/OneSignal

See `workflow-a-scheduled-template.md`.

### Workflow C: User Reply (Phase 3)

**Trigger**: Webhook `/reply`

**Input**:
```json
{
  "decisionId": "dec_abc123",
  "replyType": "modify",
  "userMessage": "I want to leave at least two hours later",
  "modifyConstraints": { "minDepartureDelayMinutes": 120 }
}
```

**Steps**:
1. Postgres → Fetch original decision by decisionId
2. HTTP Request → transport.rest (fresh connections)
3. Function → Filter connections based on modifyConstraints
4. HTTP Request → Gemini with USER_REPLY_PROMPT_TEMPLATE
5. Postgres → Store new decision
6. Respond → Return new AgentDecision

See `workflow-c-reply-template.md`.

## Testing

### Test Workflow B (Demo Mode - Default)

With `DEMO_MODE=true` (default), the workflow returns mock Use Case 1 data without calling any external APIs:

```bash
curl -X POST https://your-n8n.app.n8n.cloud/webhook/decision \
  -H "Content-Type: application/json" \
  -d '{
    "route": { "from": "Hamburg Hbf", "to": "Bremen Hbf", "preferredLine": "RE4" },
    "userContext": {
      "homeOfficeAllowed": true,
      "nextMeetingLocalTime": "10:30",
      "avoidWaitingOutdoors": true
    }
  }'
```

**Expected response (Use Case 1 mock decision)**:
```json
{
  "id": "dec_demo_123456",
  "decision": "WORK_FROM_HOME_TEMPORARILY",
  "confidence": 0.88,
  "currentUpdates": [
    {"type": "weather", "icon": "rain", "title": "Weather update", "message": "Heavy rain for the next 30 minutes", "severity": "medium"},
    {"type": "transport", "icon": "train", "title": "RE4 status", "message": "The RE4 is cancelled at 07:34 and delayed by 12 minutes at 08:06", "severity": "high", "line": "RE4"}
  ],
  "recommendation": {
    "action": "Start working from home",
    "primaryInstruction": "Take the RE4 at 08:34",
    "recommendedDepartureTime": "08:34",
    ...
  },
  "explanationShort": "RE4 cancelled. Work from home and take the stable 08:34 connection.",
  "_debug": { "mode": "demo", "dataSource": "mock", "geminiCalled": false }
}
```

### Switch to Live Mode

To use real APIs (transport.rest, Open-Meteo, Gemini):

1. In n8n: **Settings** → **Environment Variables**
2. Set `DEMO_MODE=false`
3. Add `GEMINI_API_KEY=your-key`

The workflow will then call live APIs and Gemini for real decision generation.

## Common Issues

### Gemini returns invalid JSON

- **Solution**: Add JSON validation in Function node after Gemini call
- Fallback: return a default decision (LEAVE_NOW with current time)

### transport.rest API timeout

- **Solution**: Add HTTP Request timeout (10s), retry on failure
- Fallback: use cached connections or demo mode

### Workflow execution >10s

- **Solution**: Run workflow asynchronously, return 202 Accepted immediately
- Store decision, let frontend poll GET /decision/:id

## Environment Variables in n8n

Set these in n8n **Settings** → **Environment Variables**:

```
GEMINI_API_KEY=your-google-ai-key
DEMO_MODE=false
```

## Next Steps

1. Start with Workflow B (on-demand) for MVP
2. Test with real Hamburg → Bremen data
3. Tune Gemini prompt if decisions don't make sense
4. Add Workflow A (scheduled) for automatic checks
5. Deploy: n8n Cloud stays running 24/7, API calls webhooks on demand
