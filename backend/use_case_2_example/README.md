# Use case 2: Leave earlier (weather)

**Scenario:** Late afternoon, no meetings left. Rain starts at 17:00. An earlier RE4 (16:34) avoids bad weather and waiting.

**Decision:** `LEAVE_EARLIER_THAN_USUAL` — take RE4 at 16:34 instead of usual later train.

## Examples

| File | Purpose |
|------|---------|
| [db-api/request.json](db-api/request.json) | Transport API request (Bremen → Hamburg, return) |
| [db-api/answer.json](db-api/answer.json) | Transport API response (connections) |
| [db-api/agent_info.json](db-api/agent_info.json) | Decision input: direction `"return"`, `weatherForecast`, no meetings |
| [agent/agent-decision.json](agent/agent-decision.json) | Decision output: LEAVE_EARLIER_THAN_USUAL, 16:34 |

Contract types (including optional `direction` and `weatherForecast`) are in [use_case_1_example/contracts.ts](use_case_1_example/contracts.ts). API overview: [use_case_1_example/API.md](use_case_1_example/API.md).
