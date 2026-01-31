/**
 * Shared contract types for Use Case 1.
 * Single source of truth for UI and backend.
 * See API.md and the JSON examples in db-api/ and agent/.
 */

// --- Transport API: request (db-api/request.json) ---

export interface ConnectionsRequest {
  from: { id: string; name: string };
  to: { id: string; name: string };
  departureTime: string; // ISO 8601
  maxConnections: number;
  useRealtime: boolean;
  includeRemarks: boolean;
}

// --- Transport API: response (db-api/answer.json) ---

export interface ConnectionsAnswer {
  connections: Connection[];
  queryMeta: QueryMeta;
}

export interface Connection {
  id: string;
  departure: string; // ISO 8601
  arrival: string; // ISO 8601
  durationMinutes: number;
  legs: Leg[];
}

export interface Leg {
  mode: string;
  line: string;
  operator: string;
  from: { name: string };
  to: { name: string };
  scheduledDeparture: string; // ISO 8601
  realtimeDeparture: string | null;
  scheduledArrival: string; // ISO 8601
  realtimeArrival: string | null;
  status: "CANCELLED" | "DELAYED" | "ON_TIME";
  delayMinutes?: number;
  remarks?: string[];
}

export interface QueryMeta {
  realtimeUsed: boolean;
  generatedAt: string; // ISO 8601
}

// --- Decision agent input (db-api/agent_info.json) ---
// Use case 2 extends with optional direction and weatherForecast (use_case_2_example/db-api/agent_info.json)

export interface AgentInfo {
  timeNow: string; // ISO 8601
  /** Use case 2: "outbound" (default) | "return" */
  direction?: "outbound" | "return";
  route: { from: string; to: string; preferredLine: string };
  connections: SimplifiedConnection[];
  userContext: UserContext;
  /** Use case 2: weather for leave-earlier decision */
  weatherForecast?: WeatherForecast;
}

export interface WeatherForecast {
  /** Local time HH:MM when rain (or worsening) starts */
  rainStartsLocalTime?: string;
  condition?: string; // e.g. "rain", "clear"
}

export interface SimplifiedConnection {
  dep: string; // HH:MM
  arr: string; // HH:MM
  line: string;
  status: "CANCELLED" | "DELAYED" | "ON_TIME";
  delayMin?: number;
}

export interface UserContext {
  homeOfficeAllowed: boolean;
  nextMeetingLocalTime: string | null; // HH:MM
  avoidWaitingOutdoors: boolean;
}

// --- Decision agent output (agent/agent-decision.json, agent/decision-types.json) ---

export type DecisionType =
  | "WORK_FROM_HOME_TEMPORARILY"
  | "WAIT_AND_LEAVE_LATER"
  | "LEAVE_NOW"
  | "LEAVE_EARLIER_THAN_USUAL";

export interface AgentDecision {
  decision: DecisionType;
  /** Local time HH:MM */
  recommendedDepartureTime: string;
  confidence: number; // 0.0–1.0
  explanation: string;
  /** Short version for push notifications / small UI */
  explanationShort: string;
}
