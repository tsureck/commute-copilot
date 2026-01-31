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
- `workflow-b-ondemand.json` - Simple demo workflow (mock data, for testing)
- `workflow-production.json` - Full production workflow with scheduled checks + user replies

## Architecture Philosophy: Store Once, Reason Many Times

The production workflow follows a key principle: **fetch API data once, store it, then let the LLM reason over the stored context** for all subsequent interactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STORE ONCE, REASON MANY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SCHEDULED TRIGGER (Every 5 min)                                           │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────────────┐                                                       │
│   │ Fetch APIs      │  transport.rest, Open-Meteo, Google Calendar          │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Store Context   │  → context_snapshots table (with session_token)       │
│   │ Snapshot in DB  │     - transport: connections, delays, cancellations   │
│   └────────┬────────┘     - weather: hourly forecast, rain times            │
│            │              - calendar: meetings, constraints                 │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Gemini reasons  │  LLM analyzes stored context → decision               │
│   │ over context    │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ ElevenLabs TTS  │  Generate audio explanation (.mp3)                    │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Store Decision  │  → decisions table (linked to snapshot)               │
│   │ + Send Push     │     - includes audio_url                              │
│   └─────────────────┘                                                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER REPLY (POST /reply with sessionToken)                                │
│        │                                                                    │
│        ▼                                                                    │
│   ┌─────────────────┐                                                       │
│   │ Lookup stored   │  ← context_snapshots + decisions tables               │
│   │ context by      │     NO NEW API CALLS - use stored data!               │
│   │ sessionToken    │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Gemini reasons  │  "Based on the stored connections at 08:34, 09:04..." │
│   │ over STORED     │  "The rain stops at 09:00 according to forecast..."   │
│   │ context         │                                                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ ElevenLabs TTS  │  Generate audio response (.mp3)                       │
│   └────────┬────────┘                                                       │
│            │                                                                │
│            ▼                                                                │
│   ┌─────────────────┐                                                       │
│   │ Respond to App  │  { message, audioUrl, updatedRecommendation }         │
│   └─────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
1. **Consistent reasoning**: LLM sees exact same data user saw when asking questions
2. **Faster responses**: No API latency for follow-up questions
3. **Flexible queries**: User can ask "when does rain stop?", "what's the next train?", "how delayed is the 08:06?" - all answered from stored context
4. **Auditability**: Full history of what data led to each decision

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

### Production Workflow (workflow-production.json)

**Full production workflow combining scheduled checks and user reply handling.**

**Two Entry Points:**

1. **Scheduled Trigger** (Every 5 Minutes, 6-10 AM weekdays)
2. **User Reply Webhook** (POST `/reply`)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULED PATH (Every 5 min)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Every 5 Minutes                                                │
│       │                                                         │
│       ▼                                                         │
│  Is Commute Time? ─────────────────────────────┐                │
│       │ (6-10 AM weekdays)                     │ (no)           │
│       ▼                                        ▼                │
│  ┌────────────────────────┐            Skip (Outside Hours)     │
│  │ Fetch Train Connections│                                     │
│  │ Fetch Weather          │                                     │
│  │ Fetch Calendar Events  │                                     │
│  └───────────┬────────────┘                                     │
│              │                                                  │
│              ▼                                                  │
│     Transform to AgentInfo                                      │
│              │                                                  │
│              ▼                                                  │
│     Disruption Detected? ──────────────────────┐                │
│              │ (yes)                           │ (no)           │
│              ▼                                 ▼                │
│     Get Last Decision                  Skip (No Disruption)     │
│              │                                                  │
│              ▼                                                  │
│     Build Gemini Prompt                                         │
│              │                                                  │
│              ▼                                                  │
│     Call Gemini API                                             │
│              │                                                  │
│              ▼                                                  │
│     Parse Gemini Response                                       │
│              │                                                  │
│              ▼                                                  │
│     Decision Changed? ─────────────────────────┐                │
│              │ (yes)                           │ (no)           │
│              ▼                                 ▼                │
│     Store Decision                      Skip (Unchanged)        │
│              │                                                  │
│              ▼                                                  │
│     Send Push Notification (FCM)                                │
│              │                                                  │
│              ▼                                                  │
│     📱 App receives notification with sessionToken              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    USER REPLY PATH (Webhook)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  POST /reply                                                    │
│  { sessionToken, message, replyType, modifyConstraints }        │
│       │                                                         │
│       ▼                                                         │
│  Parse User Reply                                               │
│       │                                                         │
│       ▼                                                         │
│  Get Decision by Session (DB lookup)                            │
│       │                                                         │
│       ▼                                                         │
│  Is Modify Request? ───────────────────────────┐                │
│       │ (yes)                                  │ (no: question) │
│       ▼                                        │                │
│  Fetch Later Connections                       │                │
│  (with time offset)                            │                │
│       │                                        │                │
│       └──────────────┬─────────────────────────┘                │
│                      ▼                                          │
│              Build Reply Prompt                                 │
│                      │                                          │
│                      ▼                                          │
│              Call Gemini for Reply                              │
│                      │                                          │
│                      ▼                                          │
│              Parse Reply Response                               │
│                      │                                          │
│                      ▼                                          │
│              Respond to User (JSON)                             │
│              { message, updatedDecision, newDepartureTime }     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Required Environment Variables:**

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Decision generation via Google AI |
| `ELEVENLABS_API_KEY` | Text-to-speech for audio responses |
| `ELEVENLABS_VOICE_ID` | Voice ID (e.g., "21m00Tcm4TlvDq8ikWAM") |
| `FCM_SERVER_KEY` | Firebase Cloud Messaging for push |

**Required n8n Credentials:**

| Credential | Purpose |
|------------|---------|
| `Supabase Postgres` | PostgreSQL connection for context + decisions storage |
| `Google Calendar` | OAuth2 for calendar access |

**Database Tables:**

| Table | Purpose |
|-------|---------|
| `context_snapshots` | Stores fetched API data (transport, weather, calendar) |
| `decisions` | LLM-generated recommendations linked to snapshots |
| `conversation_messages` | User replies and assistant responses with audio |

**Response Format (Always includes audio):**

Every response to the app includes an `audioUrl` pointing to an ElevenLabs-generated MP3:

```json
{
  "success": true,
  "message": {
    "id": "msg_123",
    "role": "assistant", 
    "text": "Got it! I've updated your recommendation...",
    "audioUrl": "https://storage.supabase.co/v1/object/public/audio/audio_msg_123.mp3",
    "created_at": "2026-01-31T08:30:00Z"
  },
  "updatedRecommendation": { ... },
  "sessionToken": "session_abc123"
}
```

**Session Token Flow:**

1. Scheduled check detects disruption → generates decision with `sessionToken`
2. Push notification sent to app with `sessionToken` in data payload
3. User receives notification, taps to open app
4. User asks follow-up question (e.g., "Can I leave 2 hours later?")
5. App sends POST `/reply` with `sessionToken` + user message
6. n8n looks up original decision by session token
7. Gemini generates contextual response
8. Response returned to app

**Example User Reply Request:**

```json
POST /reply
{
  "sessionToken": "session_1706716800000_abc123",
  "message": "Can I stay home for 2 more hours?",
  "replyType": "modify",
  "modifyConstraints": {
    "minDepartureDelayMinutes": 120
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "message": {
    "id": "msg_1706717400000",
    "role": "assistant",
    "text": "Got it! I've updated your recommendation. You can now work from home until 10:00 and take the RE4 at 10:34.",
    "audioUrl": "https://storage.supabase.co/v1/object/public/audio/audio_msg_1706717400000.mp3",
    "created_at": "2026-01-31T08:30:00.000Z"
  },
  "updatedRecommendation": {
    "action": "Continue working from home",
    "primaryInstruction": "Take the RE4 at 10:34",
    "recommendedDepartureTime": "10:34",
    "reasonShort": "You requested 2 more hours at home",
    "reasonLong": "Based on the stored transport data, the RE4 at 10:34 is running on time..."
  },
  "sessionToken": "session_1706716800000_abc123"
}
```

**What the LLM Sees (from stored context):**

When answering user questions, the LLM receives the full stored context:

```
TRANSPORT DATA:
{
  "connections": [
    {"departure": "07:34", "line": "RE4", "status": "CANCELLED", "remarks": ["Signal failure"]},
    {"departure": "08:06", "line": "RE4", "status": "DELAYED", "delayMinutes": 12},
    {"departure": "08:34", "line": "RE4", "status": "ON_TIME"},
    {"departure": "09:04", "line": "RE4", "status": "ON_TIME"},
    {"departure": "10:34", "line": "RE4", "status": "ON_TIME"}
  ]
}

WEATHER DATA:
{
  "condition": "rain",
  "rainStartsAt": "07:00",
  "hourlyForecast": [
    {"hour": 7, "precipitation": 2.5},
    {"hour": 8, "precipitation": 1.2},
    {"hour": 9, "precipitation": 0.1},
    {"hour": 10, "precipitation": 0}
  ]
}

CALENDAR DATA:
{
  "nextMeeting": {"title": "Team Standup", "localTime": "10:30"},
  "events": [...]
}
```

This allows the LLM to answer questions like:
- "When does the rain stop?" → "Based on the forecast, rain clears up by 9:00."
- "What about the 09:04 train?" → "The RE4 at 09:04 is running on time."
- "Can I make my 10:30 meeting if I leave at 09:04?" → "Yes, you'd arrive at ~10:15."

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
