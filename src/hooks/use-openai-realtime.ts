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

  // Gemini tools를 OpenAI Realtime 형식으로 변환
  if (config.tools && Array.isArray(config.tools)) {
    tools = config.tools
      .filter((tool: any) => tool?.functionDeclarations)
      .flatMap((tool: any) => 
        tool.functionDeclarations.map((func: any) => ({
          type: 'function',
          name: func.name,
          description: func.description,
          parameters: convertParameters(func.parameters)
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
          // 모든 이벤트 타입 로깅 (디버깅용)
          // response 관련 이벤트는 전체 데이터를 로깅
          if (data.type) {
            if (data.type.includes('response') || data.type.includes('audio')) {
              console.log('📨 [OpenAI] Received:', data.type, JSON.stringify(data, null, 2));
            } else {
              console.log('📨 [OpenAI] Received:', data.type);
            }
          } else {
            console.log('📨 [OpenAI] Received (no type):', Object.keys(data).slice(0, 5));
          }

          // session.created 이벤트를 받으면 session.update 전송
          if (data.type === 'session.created' && !sessionCreatedRef.current) {
            sessionCreatedRef.current = true;
            console.log('🔧 [OpenAI] Sending session.update...');
            
            wsRef.current?.send(JSON.stringify({
              type: 'session.update',
              session: {
                type: 'realtime',
                model: 'gpt-4o-realtime-preview-2024-12-17',
                output_modalities: ['audio'],
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
                      type: 'audio/pcm',
                      rate: 24000
                    },
                    voice: 'alloy'
                  }
                },
                instructions: config.instructions,
                tools: config.tools || [],
                tool_choice: 'auto'
              }
            }));
          }

          // session.updated 이벤트
          if (data.type === 'session.updated') {
            console.log('✅ [OpenAI] Session updated successfully');
            setConnected(true);
            triggerEvent('setupcomplete', {});
            
            // OpenAI Realtime API는 초기 응답을 자동으로 생성하지 않으므로 명시적으로 요청
            // 정상 작동하는 프로젝트 방식: conversation.item.create로 사용자 메시지를 먼저 보내고
            // 그 다음 response.create를 호출하면 응답이 생성됨
            const requestInitialResponse = () => {
              if (wsRef.current?.readyState === WebSocket.OPEN && audioRecorderRef.current) {
                console.log('🚀 [OpenAI] Requesting initial response after audio recorder is ready...');
                try {
                  // 1단계: conversation.item.create로 사용자 메시지 생성 (트리거용)
                  wsRef.current.send(JSON.stringify({
                    type: 'conversation.item.create',
                    item: {
                      type: 'message',
                      role: 'user',
                      content: [{
                        type: 'input_text',
                        text: 'Hello'
                      }]
                    }
                  }));
                  console.log('✅ [OpenAI] conversation.item.create sent (trigger message)');
                  
                  // 2단계: response.create로 AI 응답 트리거 (짧은 딜레이)
                  setTimeout(() => {
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({
                        type: 'response.create'
                      }));
                      console.log('✅ [OpenAI] response.create sent - AI should respond now');
                    } else {
                      console.warn('⚠️ [OpenAI] WebSocket closed before response.create');
                    }
                  }, 300);
                } catch (error) {
                  console.error('❌ [OpenAI] Failed to send initial response request:', error);
                }
              } else {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                  console.warn('⚠️ [OpenAI] WebSocket not OPEN yet, retrying...', wsRef.current?.readyState);
                }
                if (!audioRecorderRef.current) {
                  console.warn('⚠️ [OpenAI] Audio recorder not ready yet, retrying...');
                }
                // WebSocket이나 오디오 녹음이 아직 준비되지 않았으면 재시도
                setTimeout(requestInitialResponse, 200);
              }
            };
            
            // 오디오 녹음이 시작된 후에 초기 응답 요청 (더 긴 딜레이)
            setTimeout(requestInitialResponse, 1000);
          }

          // 오디오 응답 처리 - 여러 가능한 이벤트 타입 확인
          if (data.type === 'response.audio.delta') {
            if (data.delta) {
              console.log('🔊 [OpenAI] Audio delta received, length:', data.delta.length);
              const binaryString = atob(data.delta);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              if (!audioStreamerRef.current) {
                audioStreamerRef.current = new AudioStreamer(await audioContext());
              }
              
              audioStreamerRef.current.addPCM16(bytes);
            } else {
              console.warn('⚠️ [OpenAI] response.audio.delta received but delta is empty');
            }
          }
          
          // 다른 오디오 이벤트 타입들도 확인
          if (data.type === 'response.output_audio.delta' || data.type === 'response.output_audio_delta') {
            console.log('🔊 [OpenAI] Alternative audio delta event received:', data.type);
            if (data.delta) {
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
          }
          
          // 오디오 응답 시작
          if (data.type === 'response.audio_started' || data.type === 'response.output_audio.started') {
            console.log('🎵 [OpenAI] Audio response started');
          }
          
          // 오디오 응답 완료
          if (data.type === 'response.audio_done' || data.type === 'response.output_audio.done') {
            console.log('🎵 [OpenAI] Audio response done');
          }

          // 음성 시작 감지
          if (data.type === 'input_audio_buffer.speech_started') {
            console.log('🎤 [OpenAI] Speech started - VAD detected speech');
          }

          // 음성 중지 감지 - 이때 응답 생성 시작
          if (data.type === 'input_audio_buffer.speech_stopped') {
            console.log('🛑 [OpenAI] Speech stopped - requesting response...');
            // 음성이 중지되면 response.create를 명시적으로 요청
            setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('🚀 [OpenAI] Requesting response after speech stopped...');
                try {
                  wsRef.current.send(JSON.stringify({
                    type: 'response.create'
                  }));
                } catch (error) {
                  console.error('❌ [OpenAI] Failed to send response.create after speech stopped:', error);
                }
              }
            }, 100);
          }

          // 음성 커밋 완료 - 이때 자동으로 응답이 생성되어야 함
          if (data.type === 'input_audio_buffer.committed') {
            console.log('✅ [OpenAI] Audio buffer committed - should trigger auto response');
            // 커밋 후 자동으로 응답이 생성되어야 하지만, 명시적으로 요청
            setTimeout(() => {
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                console.log('🚀 [OpenAI] Requesting response after audio committed...');
                try {
                  wsRef.current.send(JSON.stringify({
                    type: 'response.create'
                  }));
                } catch (error) {
                  console.error('❌ [OpenAI] Failed to send response.create after commit:', error);
                }
              }
            }, 200);
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

          // 응답 생성 시작
          if (data.type === 'response.created') {
            console.log('🎬 [OpenAI] Response created - 전체 데이터:', JSON.stringify(data, null, 2));
            
            // response 객체 확인
            if (data.response) {
              console.log('📦 [OpenAI] Response created object:', {
                id: data.response.id,
                status: data.response.status,
                modality: data.response.modality,
                output: data.response.output
              });
            }
          }

          // 응답 생성 오류
          if (data.type === 'response.error') {
            console.error('❌ [OpenAI] Response error:', data.error);
            triggerEvent('error', {
              type: 'response_error',
              ...data.error
            });
            
            // 쿼터 초과 에러의 경우 특별 처리
            if (data.error?.code === 'insufficient_quota') {
              console.error('❌ [OpenAI] API Quota Exceeded - Please check your OpenAI billing and plan');
            }
          }

          // 응답 완료 - 모든 응답 데이터 확인
          if (data.type === 'response.done') {
            console.log('✅ [OpenAI] Response done - 전체 데이터:', JSON.stringify(data, null, 2));
            
            // response 객체 확인
            if (data.response) {
              const status = data.response.status;
              const statusDetails = data.response.status_details;
              
              // 응답 실패 확인
              if (status === 'failed' || statusDetails?.type === 'failed') {
                const error = statusDetails?.error || data.response.error;
                console.error('❌ [OpenAI] Response failed:', {
                  status,
                  error_type: error?.type,
                  error_code: error?.code,
                  error_message: error?.message
                });
                
                // 에러 이벤트 트리거
                triggerEvent('error', {
                  type: 'response_failed',
                  code: error?.code,
                  message: error?.message || 'Response failed'
                });
                
                // 쿼터 초과 에러의 경우 특별 처리
                if (error?.code === 'insufficient_quota') {
                  console.error('❌ [OpenAI] API Quota Exceeded - Please check your OpenAI billing and plan');
                  alert('OpenAI API 쿼터를 초과했습니다. 계정의 결제 정보와 플랜을 확인해주세요.');
                }
                
                return; // 실패한 응답은 turncomplete 트리거하지 않음
              }
              
              console.log('📦 [OpenAI] Response object:', {
                id: data.response.id,
                status: data.response.status,
                output: data.response.output,
                has_audio: !!data.response.output?.find((o: any) => o.type === 'audio'),
                has_text: !!data.response.output?.find((o: any) => o.type === 'text'),
                output_types: data.response.output?.map((o: any) => o.type)
              });
            }
            
            // 응답 아이템 확인 (오디오가 실제로 생성되었는지)
            if (data.item) {
              console.log('📦 [OpenAI] Response item:', {
                item_id: data.item.id,
                has_audio: !!data.item.audio,
                content: data.item.content?.slice(0, 2)
              });
            }
            
            triggerEvent('turncomplete', {});
          }
          
          // 응답의 모든 부분 수집
          if (data.type === 'response.output_item.added') {
            console.log('📦 [OpenAI] Response output item added:', {
              item_id: data.item?.id,
              item_type: data.item?.type,
              has_content: !!data.item?.content
            });
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
        let audioChunkCount = 0;
        audioRecorderRef.current.on('data', (base64Audio: string) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            audioChunkCount++;
            if (audioChunkCount % 50 === 0) {
              console.log(`🎤 [OpenAI] Sent ${audioChunkCount} audio chunks`);
            }
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

    // Server VAD 모드에서는 오디오 입력을 자동으로 처리
    // 텍스트 메시지도 Server VAD가 처리하도록 대기
    console.log('✅ [OpenAI] Message sent, Server VAD will handle response');
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

  // 초기 응답 생성
  const createResponse = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ [OpenAI] WebSocket not ready for response.create');
      return;
    }
    console.log('🚀 [OpenAI] Creating response...');
    wsRef.current.send(JSON.stringify({
      type: 'response.create'
    }));
  }, []);

  // 클라이언트 래퍼
  const clientWrapper = useMemo(() => ({
    send,
    sendToolResponse,
    createResponse,
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
  }), [send, sendToolResponse, createResponse]);

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
