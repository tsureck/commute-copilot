# Workflow B: On-Demand Decision

Template for creating the n8n workflow. Copy node configurations into n8n UI.

## Nodes

### 1. Webhook Trigger

**Node Type**: Webhook  
**Path**: `/decision`  
**Method**: POST  
**Response Mode**: Last Node

---

### 2. HTTP Request - Transport API

**Node Type**: HTTP Request  
**Method**: GET  
**URL**: `https://v6.db.transport.rest/journeys`  

**Query Parameters**:
```
from: 8002549  (Hamburg Hbf ID)
to: 8000050    (Bremen Hbf ID)
results: 3
departure: now
```

**Options**:
- Timeout: 10000ms
- Ignore SSL: false

---

### 3. Function - Parse Transport Response

**Node Type**: Function  
**JavaScript Code**:

```javascript
const journeys = $input.item.json.journeys;

if (!journeys || journeys.length === 0) {
  throw new Error('No journeys found');
}

const connections = journeys.map((journey, i) => {
  const leg = journey.legs[0]; // First leg (RE4)
  
  return {
    id: `conn_${i}`,
    departure: leg.departure,
    arrival: leg.arrival,
    durationMinutes: Math.round((new Date(leg.arrival) - new Date(leg.departure)) / 60000),
    legs: [{
      mode: 'train',
      line: leg.line?.name || 'RE4',
      operator: leg.line?.operator?.name || 'DB Regio',
      from: { name: leg.origin.name },
      to: { name: leg.destination.name },
      scheduledDeparture: leg.plannedDeparture,
      realtimeDeparture: leg.departure,
      scheduledArrival: leg.plannedArrival,
      realtimeArrival: leg.arrival,
      status: leg.cancelled ? 'CANCELLED' : (leg.delay > 0 ? 'DELAYED' : 'ON_TIME'),
      delayMinutes: leg.delay || 0,
      remarks: leg.remarks?.map(r => r.text) || []
    }]
  };
});

// Simplify for AgentInfo
const simplified = connections.map(c => ({
  dep: new Date(c.departure).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
  arr: new Date(c.arrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
  line: c.legs[0].line,
  status: c.legs[0].status,
  delayMin: c.legs[0].delayMinutes
}));

return { connections: simplified };
```

---

### 4. HTTP Request - Weather API

**Node Type**: HTTP Request  
**Method**: GET  
**URL**: `https://api.open-meteo.com/v1/forecast`

**Query Parameters**:
```
latitude: 53.55
longitude: 9.99
hourly: precipitation,weathercode
forecast_days: 1
```

---

### 5. Function - Parse Weather Response

**Node Type**: Function  
**JavaScript Code**:

```javascript
const hourly = $input.item.json.hourly;
const now = new Date();

// Check next 3 hours for rain
const rainStartIndex = hourly.precipitation.findIndex((p, i) => i < 3 && p > 0.1);
const rainStartsLocalTime = rainStartIndex >= 0 
  ? new Date(hourly.time[rainStartIndex]).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  : null;

return {
  rainStartsLocalTime,
  condition: rainStartIndex >= 0 ? 'rain' : 'clear'
};
```

---

### 6. Function - Build AgentInfo

**Node Type**: Function  
**JavaScript Code**:

```javascript
const webhookData = $('Webhook').first().json.body;
const connections = $('Function - Parse Transport').first().json.connections;
const weather = $('Function - Parse Weather').first().json;

const agentInfo = {
  timeNow: webhookData.timeNow || new Date().toISOString(),
  route: webhookData.route,
  connections,
  userContext: webhookData.userContext,
  weatherForecast: weather.rainStartsLocalTime ? weather : undefined
};

return { agentInfo };
```

---

### 7. HTTP Request - Gemini API

**Node Type**: HTTP Request  
**Method**: POST  
**URL**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

**Authentication**: Add API key in query param `key={{$env.GEMINI_API_KEY}}`

**Headers**:
```
Content-Type: application/json
```

**Body** (JSON):
```json
{
  "contents": [{
    "parts": [{
      "text": "{{$json.prompt}}"
    }]
  }],
  "generationConfig": {
    "response_mime_type": "application/json",
    "temperature": 0.7
  }
}
```

**Pre-Execute Code** (JavaScript):
```javascript
const agentInfo = $('Function - Build AgentInfo').first().json.agentInfo;

const systemPrompt = `You are a commute decision assistant for a knowledge worker who regularly travels Hamburg → Bremen via RE4 train.

Your role: Analyze current transport status, weather, and user context, then decide what the user should do. Output exactly ONE recommended action with clear reasoning.

Core principle: "This app tells you what to do" — not just show routes or ETAs.

Decision types:
- WORK_FROM_HOME_TEMPORARILY: Start working from home, take a later stable train
- WAIT_AND_LEAVE_LATER: Wait for a better connection
- LEAVE_NOW: Leave immediately
- LEAVE_EARLIER_THAN_USUAL: Leave earlier to avoid rain

Rules:
- Penalize cancelled trains heavily
- Penalize delays (>10 min)
- Consider weather when waiting outdoors
- Consider meeting buffer
- Output must be valid JSON`;

const userPrompt = `Current situation:
${JSON.stringify(agentInfo, null, 2)}

Output JSON (strict schema):
{
  "id": "dec_${Date.now().toString().slice(-6)}",
  "decision": "...",
  "confidence": 0.0-1.0,
  "currentUpdates": [],
  "recommendation": {},
  "explanationShort": "...",
  "explanationLong": "...",
  "uiHints": {}
}`;

const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

return { prompt: fullPrompt };
```

---

### 8. Function - Parse Gemini Response

**Node Type**: Function  
**JavaScript Code**:

```javascript
const geminiResponse = $input.item.json;

try {
  const text = geminiResponse.candidates[0].content.parts[0].text;
  const decision = JSON.parse(text);
  
  // Validate required fields
  if (!decision.decision || !decision.recommendation || !decision.explanationShort) {
    throw new Error('Invalid decision structure from Gemini');
  }
  
  return decision;
} catch (error) {
  console.error('Gemini response parse error:', error);
  
  // Fallback decision
  return {
    id: `dec_fallback_${Date.now()}`,
    decision: 'LEAVE_NOW',
    confidence: 0.5,
    currentUpdates: [],
    recommendation: {
      action: 'Check manually',
      primaryInstruction: 'Review transport status',
      recommendedDepartureTime: 'now',
      icon: 'train',
      reasonShort: 'Unable to generate recommendation',
      reasonLong: 'Please check transport status manually.'
    },
    explanationShort: 'System unavailable. Check manually.',
    explanationLong: 'Could not generate decision. Please check transport status.',
    uiHints: { highlightAction: false, playVoiceSummary: false, confidenceIndicator: 'low' }
  };
}
```

---

### 9. Postgres - Store Decision

**Node Type**: Postgres  
**Operation**: Execute Query  
**Query**:

```sql
INSERT INTO decisions (
  id, decision, confidence, current_updates, recommendation,
  explanation_short, explanation_long, ui_hints, created_at
) VALUES (
  $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8::jsonb, NOW()
)
RETURNING *
```

**Parameters**:
```javascript
[
  $json.id,
  $json.decision,
  $json.confidence,
  JSON.stringify($json.currentUpdates),
  JSON.stringify($json.recommendation),
  $json.explanationShort,
  $json.explanationLong,
  JSON.stringify($json.uiHints)
]
```

---

### 10. Respond to Webhook

**Node Type**: Respond to Webhook  
**Response**: `{{$json}}`

---

## Testing

1. Save workflow and activate
2. Copy webhook URL
3. Test with curl (see main README.md)

## Notes

- For demo mode: add IF node after Webhook that checks `$env.DEMO_MODE`, skip HTTP requests and use hardcoded mocked data
- Gemini may take 2–5s; total workflow ~5–10s
- If workflow times out, increase n8n execution timeout in settings
