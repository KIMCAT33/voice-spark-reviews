import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder } from '@/lib/audio-recorder';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import { LiveConnectConfig } from "@google/genai";

export type UseOpenAIRealtimeResults = {
  client: any;
  agent: null;
  setConfig: (config: LiveConnectConfig | { instructions?: string; tools?: any[] }) => void;
  config: { instructions?: string; tools?: any[] };
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  setupComplete: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  send: (parts: Array<{ text: string }>) => void;
  sendToolResponse: (response: any) => void;
  on: (event: string, handler: any) => void;
  off: (event: string, handler: any) => void;
};

// Gemini Type enum을 OpenAI 형식으로 변환
function convertGeminiTypeToOpenAI(type: any): string {
  if (typeof type === 'string') {
    return type.toLowerCase();
  }
  const typeStr = String(type);
  return typeStr.toLowerCase();
}

// Gemini parameters를 OpenAI 형식으로 재귀적으로 변환
function convertParameters(params: any): any {
  if (!params || typeof params !== 'object') {
    return params;
  }

  const converted: any = {};
  
  for (const key in params) {
    if (key === 'type') {
      converted.type = convertGeminiTypeToOpenAI(params.type);
    } else if (key === 'properties' && typeof params.properties === 'object') {
      converted.properties = {};
      for (const propKey in params.properties) {
        converted.properties[propKey] = convertParameters(params.properties[propKey]);
      }
    } else if (key === 'items' && typeof params.items === 'object') {
      converted.items = convertParameters(params.items);
    } else if (key === 'enum' && Array.isArray(params.enum)) {
      converted.enum = params.enum;
    } else if (key === 'description') {
      converted.description = params.description;
    } else if (key === 'required' && Array.isArray(params.required)) {
      converted.required = params.required;
    }
  }
  
  return converted;
}

// Gemini config를 OpenAI instructions로 변환
function convertGeminiConfigToOpenAI(config: LiveConnectConfig): { instructions: string; tools: any[] } {
  let instructions = '';
  let tools: any[] = [];

  const systemInst = config.systemInstruction as any;
  if (systemInst?.parts) {
    instructions = systemInst.parts
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // Gemini tools를 OpenAI 형식으로 변환
  if (config.tools && Array.isArray(config.tools)) {
    tools = config.tools
      .filter((tool: any) => tool?.functionDeclarations)
      .flatMap((tool: any) => 
        tool.functionDeclarations.map((func: any) => ({
          type: 'function',
          function: {
            name: func.name,
            description: func.description,
            parameters: convertParameters(func.parameters)
          }
        }))
      );
  }

  console.log('✅ [OpenAI] Converted config:', {
    instructionsLength: instructions.length,
    toolsCount: tools.length
  });

  return { instructions, tools };
}

export function useOpenAIRealtime(): UseOpenAIRealtimeResults {
  const [model, setModel] = useState('gpt-4o-realtime-preview-2024-12-17');
  const [connected, setConnected] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [volume, setVolume] = useState(0);
  const [config, setConfigState] = useState<{ instructions?: string; tools?: any[] }>({});

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const ephemeralKeyRef = useRef<string>('');
  const sessionCreatedRef = useRef(false);
  const connectingRef = useRef(false);

  // Ephemeral key 생성
  const generateEphemeralKey = async (): Promise<string> => {
    try {
      console.log('🔑 [OpenAI] Generating ephemeral key...');
      const { data, error } = await supabase.functions.invoke('realtime-client-secret');
      
      if (error) throw error;
      
      const clientSecret = data?.clientSecret;
      if (!clientSecret) throw new Error('No client secret received');
      
      ephemeralKeyRef.current = clientSecret;
      console.log('✅ [OpenAI] Ephemeral key generated');
      return clientSecret;
    } catch (error) {
      console.error('❌ [OpenAI] Failed to generate ephemeral key:', error);
      throw error;
    }
  };

  // 이벤트 핸들러 관리
  const triggerEvent = (event: string, data: any) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  };

  const on = useCallback((event: string, handler: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(handler);
  }, []);

  const off = useCallback((event: string, handler: Function) => {
    eventHandlersRef.current.get(event)?.delete(handler);
  }, []);

  // 설정 업데이트
  const setConfig = useCallback((newConfig: LiveConnectConfig | { instructions?: string; tools?: any[] }) => {
    console.log('📥 [OpenAI] setConfig called');
    
    // Gemini 형식의 config인지 확인
    if ('systemInstruction' in newConfig) {
      const converted = convertGeminiConfigToOpenAI(newConfig as LiveConnectConfig);
      setConfigState(converted);
      setSetupComplete(true);
      console.log('✅ [OpenAI] Config converted and set');
    } else {
      setConfigState(newConfig);
      setSetupComplete(true);
      console.log('✅ [OpenAI] Config set directly');
    }
  }, []);

  // 연결
  const connect = useCallback(async () => {
    if (connectingRef.current || connected) {
      console.log('⏸️ [OpenAI] Already connecting or connected');
      return;
    }

    if (!config.instructions) {
      console.error('❌ [OpenAI] No instructions configured');
      return;
    }

    connectingRef.current = true;

    try {
      console.log('🔌 [OpenAI] Starting WebSocket connection...');
      
      const clientSecret = await generateEphemeralKey();
      const url = `wss://api.openai.com/v1/realtime?model=${model}`;
      
      wsRef.current = new WebSocket(url, [
        'realtime',
        `openai-insecure-api-key.${clientSecret}`
      ]);

      wsRef.current.onopen = () => {
        console.log('✅ [OpenAI] WebSocket connected');
        sessionCreatedRef.current = false;
      };

      wsRef.current.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [OpenAI] Received:', data.type);

          // session.created 이벤트를 받으면 session.update 전송
          if (data.type === 'session.created' && !sessionCreatedRef.current) {
            sessionCreatedRef.current = true;
            console.log('🔧 [OpenAI] Sending session.update...');
            
            wsRef.current?.send(JSON.stringify({
              type: 'session.update',
              session: {
                type: 'realtime',
                model: 'gpt-4o-realtime-preview-2024-12-17',
                output_modalities: ['audio', 'text'],
                audio: {
                  input: {
                    format: {
                      type: 'audio/pcm',
                      rate: 24000
                    },
                    turn_detection: {
                      type: 'semantic_vad'
                    }
                  },
                  output: {
                    format: {
                      type: 'audio/pcm'
                    },
                    voice: 'alloy'
                  }
                },
                instructions: config.instructions,
                tools: config.tools || [],
                tool_choice: 'auto',
                temperature: 0.8
              }
            }));
          }

          // session.updated 이벤트
          if (data.type === 'session.updated') {
            console.log('✅ [OpenAI] Session updated successfully');
            setConnected(true);
            triggerEvent('setupcomplete', {});
            
            // 연결 후 초기 응답 트리거
            setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('🎬 [OpenAI] Triggering initial response...');
                wsRef.current.send(JSON.stringify({ type: 'response.create' }));
              }
            }, 500);
          }

          // 오디오 응답 처리
          if (data.type === 'response.audio.delta' && data.delta) {
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            if (!audioStreamerRef.current) {
              audioStreamerRef.current = new AudioStreamer(await audioContext());
            }
            
            audioStreamerRef.current.addPCM16(bytes);
          }

          // 텍스트 응답 처리
          if (data.type === 'response.audio_transcript.delta' && data.delta) {
            triggerEvent('message', {
              type: 'transcription',
              text: data.delta
            });
          }

          // Tool call 처리
          if (data.type === 'response.function_call_arguments.done') {
            triggerEvent('toolcall', {
              functionCalls: [{
                name: data.name,
                args: JSON.parse(data.arguments)
              }]
            });
          }

          // 응답 완료
          if (data.type === 'response.done') {
            triggerEvent('turncomplete', {});
          }

          // 에러 처리
          if (data.type === 'error') {
            console.error('❌ [OpenAI] Error:', data.error);
            triggerEvent('error', data.error);
          }
        } catch (error) {
          console.error('❌ [OpenAI] Message parsing error:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ [OpenAI] WebSocket error:', error);
        setConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('🔌 [OpenAI] WebSocket closed');
        setConnected(false);
        sessionCreatedRef.current = false;
      };

      // 오디오 녹음 시작
      if (!audioRecorderRef.current) {
        console.log('🎤 [OpenAI] Starting audio recorder...');
        audioRecorderRef.current = new AudioRecorder(24000);
        audioRecorderRef.current.on('data', (base64Audio: string) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio
            }));
          }
        });
        await audioRecorderRef.current.start();
        console.log('✅ [OpenAI] Audio recorder started');
      }
    } catch (error) {
      console.error('❌ [OpenAI] Connection error:', error);
      setConnected(false);
    } finally {
      connectingRef.current = false;
    }
  }, [config, model]);

  // 연결 해제
  const disconnect = useCallback(async () => {
    console.log('🔌 [OpenAI] Disconnecting...');
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
    sessionCreatedRef.current = false;
    console.log('✅ [OpenAI] Disconnected');
  }, []);

  // 메시지 전송
  const send = useCallback((parts: Array<{ text: string }>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ [OpenAI] WebSocket not ready');
      return;
    }

    const text = parts.map(p => p.text).join(' ');
    console.log('📤 [OpenAI] Sending message:', text.substring(0, 100));

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: text
        }]
      }
    }));

    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'response.create' }));
        console.log('✅ [OpenAI] Response triggered');
      }
    }, 100);
  }, []);

  // Tool 응답 전송
  const sendToolResponse = useCallback((response: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    console.log('🔧 [OpenAI] Sending tool response:', response);
    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: response.id,
        output: JSON.stringify(response.result)
      }
    }));
  }, []);

  // 클라이언트 래퍼
  const clientWrapper = useMemo(() => ({
    send,
    sendToolResponse,
    sendRealtimeInput: (chunks: Array<{ mimeType: string; data: string }>) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      
      chunks.forEach((chunk) => {
        if (chunk.mimeType.includes('audio')) {
          wsRef.current?.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: chunk.data
          }));
        }
      });
    }
  }), [send, sendToolResponse]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    client: clientWrapper,
    agent: null,
    setConfig,
    config,
    model,
    setModel,
    connected,
    setupComplete,
    connect,
    disconnect,
    volume,
    send,
    sendToolResponse,
    on,
    off
  };
}
