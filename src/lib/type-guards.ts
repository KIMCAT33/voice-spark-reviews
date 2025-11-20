import { GenAILiveClient } from '@/lib/genai-live-client';

/**
 * Type guard to check if client is GenAILiveClient (Gemini)
 * Checks for unique GenAILiveClient methods and properties
 */
export function isGenAILiveClient(
  client: any
): client is GenAILiveClient {
  // Check for GenAILiveClient-specific properties
  // GenAILiveClient has 'ws' property at root level and specific methods
  if (!client) return false;
  
  // Check for unique GenAILiveClient signature:
  // - has send() method
  // - has disconnect() method  
  // - does NOT have 'conversation' or 'agent' properties (OpenAI specific)
  const hasGenAIMethods = 
    typeof client.send === 'function' &&
    typeof client.disconnect === 'function';
  
  const lacksOpenAIProperties = 
    !('conversation' in client) &&
    !('agent' in client);
  
  return hasGenAIMethods && lacksOpenAIProperties;
}

/**
 * Type guard to check if client is RealtimeSession (OpenAI)
 */
export function isRealtimeSession(
  client: any
): boolean {
  // OpenAI RealtimeSession has 'conversation' or 'agent' property
  return client !== null && ('conversation' in client || 'agent' in client);
}
