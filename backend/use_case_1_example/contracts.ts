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

export interface AgentInfo {
  timeNow: string; // ISO 8601
  route: { from: string; to: string; preferredLine: string };
  connections: SimplifiedConnection[];
  userContext: UserContext;
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
}
