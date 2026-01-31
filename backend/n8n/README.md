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

1. Copy JSON from `workflow-b-ondemand.json`
2. In n8n: **Workflows** → **Import from File** → paste JSON
3. Activate the workflow
4. Copy the webhook URL (e.g. `https://your-n8n.app.n8n.cloud/webhook/abc123`)
5. Add to your API `.env` as `N8N_WEBHOOK_BASE_URL`

Repeat for Workflow A (scheduled) and C (reply).

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

**Steps**:
1. HTTP Request → transport.rest API (Hamburg → Bremen journeys)
2. Function → Parse connections to ConnectionsAnswer
3. HTTP Request → Open-Meteo (Hamburg weather)
4. Function → Parse weather to weatherForecast
5. Function → Build AgentInfo (combine transport + weather + userContext)
6. HTTP Request → Google Gemini API (with prompt from prompts.ts)
7. Function → Validate and clean Gemini JSON response
8. Postgres → Store decision in database
9. Respond → Return AgentDecision JSON

**Output**: AgentDecision matching contracts.ts

See `workflow-b-ondemand-template.md` for detailed node configuration.

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

### Test Workflow B (on-demand)

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

Expected: JSON response with AgentDecision (decision, currentUpdates, recommendation, etc.)

### Test with Demo Mode

Add environment variable in n8n:
- `DEMO_MODE=true`

When true, skip transport.rest and use mocked connections from `../use_case_1_example/db-api/answer.json`.

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
