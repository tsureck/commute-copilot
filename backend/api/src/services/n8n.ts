/**
 * n8n Webhook Service
 * Triggers n8n workflows for decision generation and user replies
 */

const N8N_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || '';
const DECISION_WEBHOOK = process.env.N8N_DECISION_WEBHOOK || '/decision';
const REPLY_WEBHOOK = process.env.N8N_REPLY_WEBHOOK || '/reply';

export async function triggerN8nWebhook(
  type: 'decision' | 'reply',
  payload: any
): Promise<any> {
  if (!N8N_BASE_URL) {
    throw new Error('N8N_WEBHOOK_BASE_URL not configured');
  }

  const webhookPath = type === 'decision' ? DECISION_WEBHOOK : REPLY_WEBHOOK;
  const url = `${N8N_BASE_URL}${webhookPath}`;

  console.log(`Triggering n8n webhook: ${type} at ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error calling n8n ${type} webhook:`, error);
    throw new Error(`Failed to trigger n8n workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
