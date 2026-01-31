# API Contract (Use Case 1)

Contract for parallel UI and backend work. All times in decision responses are **local time** unless otherwise noted.

TypeScript types for all payloads: [contracts.ts](contracts.ts).

## Naming

- **`recommendedDepartureTime`**: Local time in `HH:MM`. Lives in **recommendation.recommendedDepartureTime** (and optionally in **recommendation.primaryInstruction** as human text).

---

## MVP: Single decision endpoint (Option B)

**Endpoint:** `POST .../decision`

**Request body:** Route + user context (backend fetches connections and builds agent_info internally).

Example shape (backend may accept a subset or equivalent):

- `timeNow` (optional): ISO 8601; defaults to "now"
- `route`: `{ "from": string, "to": string, "preferredLine": string }`
- `userContext`: `{ "homeOfficeAllowed": boolean, "nextMeetingLocalTime": string | null, "avoidWaitingOutdoors": boolean }`

See [db-api/agent_info.json](db-api/agent_info.json) for the full structure the decision engine consumes (backend builds this from transport API + request).

**Response:** Decision object. Example: [agent/agent-decision.json](agent/agent-decision.json).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (optional) | Id for push/reply reference; set by backend when creating decision |
| `decision` | string | One of the values in [agent/decision-types.json](agent/decision-types.json) |
| `confidence` | number | 0.0–1.0 |
| `currentUpdates` | array | List of "what changed" cards (weather, transport): `type`, `icon`, `title`, `message`, `severity` (low/medium/high), optional `line` |
| `recommendation` | object | Single action: `action`, `primaryInstruction`, `recommendedDepartureTime` (HH:MM), `icon`, `reasonShort`, `reasonLong` |
| `explanationShort` | string | Short version for push notifications / small UI |
| `explanationLong` | string | Full human-readable reasoning |
| `uiHints` | object (optional) | UI behavior: `highlightAction`, `playVoiceSummary`, `confidenceIndicator` (low/medium/high) |

---

## Optional: Two endpoints (Option A)

If the UI should show raw connections and/or build agent_info itself:

1. **Get connections**  
   - `GET` or `POST` `.../connections`  
   - Request: [db-api/request.json](db-api/request.json)  
   - Response: [db-api/answer.json](db-api/answer.json)

2. **Get decision**  
   - `POST .../decision`  
   - Request body: [db-api/agent_info.json](db-api/agent_info.json)  
   - Response: [agent/agent-decision.json](agent/agent-decision.json)

---

## Push & reply

**Flow:** Backend computes a decision → sends a **push** (slim payload) → user clicks → frontend fetches full decision by id → shows info and plays **voice** → user can **reply** (accept / reject / modify) → for "modify", backend returns a new decision.

### Push payload (backend → push / frontend)

Slim payload for the notification and deep link. Backend builds it from the full **AgentDecision**. Type: **DecisionPushPayload** in [contracts.ts](contracts.ts).

| Field | Type | Description |
|-------|------|-------------|
| `decisionId` | string | Id of the decision; frontend uses it to fetch full decision or open deep link |
| `decision` | string | Same as AgentDecision.decision |
| `explanationShort` | string | Notification body text |
| `recommendedDepartureTime` | string | HH:MM |
| `title` | string (optional) | Notification title (e.g. "Commute update") |
| `deepLink` | string (optional) | App deep link, e.g. `app://decision/{decisionId}` |

### Fetch full decision (when user clicks)

- **`GET .../decision/:id`** — Returns full **AgentDecision** for the given `id`. Frontend uses this after the user opens the notification (or uses cached decision if already present).

### Voice

When **uiHints.playVoiceSummary** is true, frontend uses **explanationLong** (or **recommendation.reasonLong**) for TTS. No separate voiceScript in MVP.

### User reply (frontend → backend)

- **`POST .../decision/:id/reply`** (or **`POST .../reply`** with body containing `decisionId`)  
- **Request body:** **UserReply** — `decisionId`, `replyType` (`"accept"` | `"reject"` | `"modify"`), optional `userMessage`, optional `modifyConstraints` (see [contracts.ts](contracts.ts)).
- **Response:**  
  - **Accept / Reject:** 204 No Content (or 200 with `{ acknowledged: true }`).  
  - **Modify:** 200 OK with body = new **AgentDecision** (new `id`); backend re-runs decision with user constraint (e.g. `minDepartureDelayMinutes: 120` or `userMessage`).

Example modify reply: `{ "decisionId": "...", "replyType": "modify", "userMessage": "I want to leave at least two hours later", "modifyConstraints": { "minDepartureDelayMinutes": 120 } }`.

---

## Decision enum

Allowed values for `decision` are listed in [agent/decision-types.json](agent/decision-types.json):

- `WORK_FROM_HOME_TEMPORARILY`
- `WAIT_AND_LEAVE_LATER`
- `LEAVE_NOW`
- `LEAVE_EARLIER_THAN_USUAL`

---

## Use case 2: Leave earlier (weather)

Use case 2 (no meetings + rain later → leave earlier) extends `agent_info` with optional fields:

- **`direction`**: `"outbound"` (default) | `"return"` — return journey Bremen → Hamburg.
- **`weatherForecast`**: `{ rainStartsLocalTime?: string, condition?: string }` — e.g. rain at 17:00.

Decision type: `LEAVE_EARLIER_THAN_USUAL`. Request/answer shapes are unchanged; swap from/to for return.

**Examples:** [../use_case_2_example/](../use_case_2_example/) — [db-api/agent_info.json](../use_case_2_example/db-api/agent_info.json), [agent/agent-decision.json](../use_case_2_example/agent/agent-decision.json).
