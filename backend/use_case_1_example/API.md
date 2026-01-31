# API Contract (Use Case 1)

Contract for parallel UI and backend work. All times in decision responses are **local time** unless otherwise noted.

TypeScript types for all payloads: [contracts.ts](contracts.ts).

## Naming

- **`recommendedDepartureTime`**: Local time in `HH:MM`. This is the canonical field name for the recommended departure in the decision response.

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
| `decision` | string | One of the values in [agent/decision-types.json](agent/decision-types.json) |
| `recommendedDepartureTime` | string | Local time `HH:MM` |
| `confidence` | number | 0.0–1.0 |
| `explanation` | string | Human-readable reasoning |

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
