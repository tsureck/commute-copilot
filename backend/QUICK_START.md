# Backend Quick Start Guide

Get the backend running in **30 minutes** for your hackathon demo.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] Gmail/Google account (for Gemini API)
- [ ] Email address (for n8n.cloud and Supabase)

## Step 1: Database (5 min)

1. Go to [supabase.com](https://supabase.com) → **Start your project**
2. Create new project (name: `commute-copilot`)
3. Wait for project to be ready (~2 min)
4. Go to **SQL Editor** → **New query**
5. Copy entire contents of `backend/database/schema.sql`
6. Paste and click **Run**
7. Go to **Settings** → **API** → copy:
   - **Project URL** (e.g. `https://abc123.supabase.co`)
   - **anon public** key

✅ Database ready!

## Step 2: Gemini API (2 min)

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Click **Create API key**
3. Copy the key (starts with `AIza...`)

✅ Gemini ready! (Free tier: 60 requests/min)

## Step 3: n8n Workflow (10 min)

1. Go to [n8n.cloud](https://n8n.cloud) → **Start for free**
2. Create account, create new workflow
3. Click **⋮** (menu) → **Settings** → **Environment Variables**
   - Add: `GEMINI_API_KEY` = your key from Step 2
4. **Import workflow**:
   - Open `backend/n8n/workflow-b-ondemand-template.md`
   - Follow the node-by-node instructions to build the workflow
   - Or: use n8n's AI workflow builder and paste the template
5. **Add Supabase credential**:
   - In workflow, when you add the Postgres node:
   - Host: `db.abc123.supabase.co` (from your Supabase URL)
   - Database: `postgres`
   - User: `postgres`
   - Password: (from Supabase **Settings** → **Database** → **Connection string**)
   - Port: `5432`
6. **Activate workflow**
7. Click the **Webhook** node → copy the webhook URL
   - Example: `https://your-n8n.app.n8n.cloud/webhook/abc123def456`

✅ n8n ready!

## Step 4: Node.js API (8 min)

```bash
cd backend/api

# Install dependencies (2 min)
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env`** with your values:

```bash
PORT=3000
NODE_ENV=development

# Paste your n8n webhook URL from Step 3
N8N_WEBHOOK_BASE_URL=https://your-n8n.app.n8n.cloud/webhook
N8N_DECISION_WEBHOOK=/abc123def456  # The path after /webhook/

# Paste from Step 1
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_KEY=eyJhb...  # anon public key

# Optional: skip for now
DATABASE_URL=postgresql://...

# Demo mode OFF (use real APIs)
DEMO_MODE=false
```

**Start the API:**

```bash
npm run dev
```

Should see:
```
🚂 Commute Copilot API running on port 3000
```

✅ API ready!

## Step 5: Test (5 min)

### Test 1: Health check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "database": "connected",
  "n8nWebhook": "configured"
}
```

### Test 2: Generate decision

```bash
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
```

Expected (after ~5-10 seconds):
```json
{
  "id": "dec_123456",
  "decision": "LEAVE_NOW",
  "confidence": 0.85,
  "currentUpdates": [...],
  "recommendation": {
    "action": "Leave now",
    "primaryInstruction": "Take the RE4 at ...",
    "recommendedDepartureTime": "...",
    ...
  },
  "explanationShort": "...",
  "explanationLong": "..."
}
```

✅ **Backend working!**

## Troubleshooting

### "n8n webhook failed"

- Check n8n workflow is **activated** (toggle in top-right)
- Verify webhook URL in `.env` (should include full base URL + path)
- Test n8n directly: `curl -X POST https://your-n8n.app.n8n.cloud/webhook/abc123 -d '{"test":true}'`

### "Gemini API error"

- Check `GEMINI_API_KEY` in n8n **Settings** → **Environment Variables**
- Test key: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_KEY" -d '{"contents":[{"parts":[{"text":"hi"}]}]}'`

### "Database error"

- Check Supabase project is running (not paused)
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Test: `curl https://abc123.supabase.co/rest/v1/decisions -H "apikey: YOUR_KEY"`

### Workflow takes >30s

- Normal for first run (Gemini API cold start)
- Subsequent runs: 5–10s
- If consistently slow: check n8n execution logs for bottlenecks

## Demo Mode (for offline testing)

Set in `.env`:
```bash
DEMO_MODE=true
```

And in n8n **Environment Variables**:
```
DEMO_MODE=true
```

This uses mocked Hamburg → Bremen data (cancelled RE4 at 07:34, delayed at 08:06, on-time at 08:34) without calling live APIs.

## Next Steps

1. ✅ Backend running locally
2. Connect frontend to `http://localhost:3000`
3. Deploy API to Railway/Render (keeps n8n webhooks, just change base URL)
4. Add Workflow A (scheduled checks every 5 min)
5. Add push notifications

## Need Help?

- **n8n docs**: [docs.n8n.io](https://docs.n8n.io)
- **Gemini API docs**: [ai.google.dev](https://ai.google.dev)
- **Supabase docs**: [supabase.com/docs](https://supabase.com/docs)

**Estimated total time**: ~30 minutes (most spent waiting for Gemini/n8n responses during first test)
