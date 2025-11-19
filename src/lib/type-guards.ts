import { GenAILiveClient } from '@/lib/genai-live-client';

/**
 * Type guard to check if client is GenAILiveClient
 */
export function isGenAILiveClient(
  client: any
): client is GenAILiveClient {
  return client !== null && 'send' in client && typeof (client as any).send === 'function';
}

/**
 * Type guard to check if client is RealtimeSession
 */
export function isRealtimeSession(
  client: any
): boolean {
  return client !== null && 'conversation' in client;
}
