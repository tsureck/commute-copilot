/**
 * n8n Backend API client for sending user messages and receiving assistant responses.
 */

import { N8N_BASE_URL } from '../config';

// ============================================================================
// Types
// ============================================================================

export interface UserAnswerRequest {
  decisionId: string;
  text: string;
}

export interface AssistantResponse {
  id: string;
  role: 'assistant';
  text: string;
  created_at: string;
}

export interface ErrorResponse {
  detail: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Send user's transcribed text to n8n and get the assistant's response.
 * 
 * @param decisionId - Unique identifier for the decision context
 * @param text - User's transcribed text from speech-to-text
 * @returns Assistant's response
 * @throws Error if the API call fails
 */
export async function sendUserAnswer(
  decisionId: string,
  text: string
): Promise<AssistantResponse> {
  const request: UserAnswerRequest = {
    decisionId,
    text,
  };

  const response = await fetch(`${N8N_BASE_URL}/user_answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as ErrorResponse;
    throw new Error(errorData.detail || `n8n request failed: ${response.status}`);
  }

  const data = await response.json() as AssistantResponse;
  return data;
}
