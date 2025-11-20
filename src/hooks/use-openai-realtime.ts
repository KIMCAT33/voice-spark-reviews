import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { supabase } from '@/integrations/supabase/client';
import { AudioRecorder } from '@/lib/audio-recorder';
import { AudioStreamer } from '@/lib/audio-streamer';
import { audioContext } from '@/lib/utils';
import VolMeterWorket from '@/lib/worklets/vol-meter';

import { LiveConnectConfig } from "@google/genai";

export type UseOpenAIRealtimeResults = {
  client: RealtimeSession | null;
  agent: RealtimeAgent | null;
  setConfig: (config: LiveConnectConfig | { instructions?: string; tools?: any[] }) => void;
  config: { instructions?: string; tools?: any[] };
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  setupComplete: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
  // Gemini와 호환성을 위한 메서드들
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
  // Type enum 객체인 경우
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

  console.log('🔄 [OpenAI] Converting config:', {
    hasSystemInstruction: !!config.systemInstruction,
    hasParts: !!(config.systemInstruction as any)?.parts,
    partsLength: (config.systemInstruction as any)?.parts?.length || 0,
    hasTools: !!config.tools,
    toolsLength: config.tools?.length || 0
  });

  // systemInstruction에서 text 추출
  const systemInst = config.systemInstruction as any;
  if (systemInst?.parts) {
    instructions = systemInst.parts
      .map((part: any, index: number) => {
        console.log(`📄 [OpenAI] Processing part ${index}:`, typeof part, part);
        if (typeof part === 'string') return part;
        if (part?.text) return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
    
    console.log('✅ [OpenAI] Extracted instructions length:', instructions.length);
    if (instructions.length === 0) {
      console.error('❌ [OpenAI] Warning: No instructions extracted from systemInstruction.parts!');
    }
  } else {
    console.warn('⚠️ [OpenAI] No systemInstruction.parts found in config');
  }

  // tools 변환
  if (config.tools) {
    config.tools.forEach((tool: any, toolIndex: number) => {
      console.log(`🔧 [OpenAI] Processing tool ${toolIndex}:`, tool);
      if (tool.functionDeclarations) {
        tool.functionDeclarations.forEach((funcDecl: any, funcIndex: number) => {
          console.log(`  📦 Function ${funcIndex}:`, funcDecl.name);
          
          // Parameters를 OpenAI 형식으로 변환
          const convertedParams = funcDecl.parameters ? convertParameters(funcDecl.parameters) : {};
          
          console.log(`  📝 Converted parameters:`, JSON.stringify(convertedParams, null, 2));
          
          // OpenAI tool 형식으로 변환
          tools.push({
            type: 'function',
            function: {
              name: funcDecl.name,
              description: funcDecl.description,
              parameters: convertedParams
            }
          });
        });
      }
    });
    console.log('✅ [OpenAI] Converted tools count:', tools.length);
  }

  return { instructions, tools };
}

export function useOpenAIRealtime(apiKey?: string): UseOpenAIRealtimeResults {
  const sessionRef = useRef<RealtimeSession | null>(null);
  const agentRef = useRef<RealtimeAgent | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const ephemeralKeyRef = useRef<string | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());

  const [model, setModel] = useState<string>('gpt-realtime');
  const [config, setConfigState] = useState<{ instructions?: string; tools?: any[] }>({});
  const [connected, setConnected] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const connectingRef = useRef(false); // 중복 연결 방지

  // Ephemeral key 생성
  const generateEphemeralKey = useCallback(async () => {
    try {
      // 로컬 개발 환경에서는 클라이언트에서 직접 OpenAI API 호출 (테스트용)
      // 프로덕션에서는 Supabase Function을 통해 호출해야 함
      const isLocalDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalDev && apiKey) {
        // 로컬 개발: 클라이언트에서 직접 OpenAI API 호출
        console.log('🔑 [OpenAI] 로컬 개발 환경 - 클라이언트에서 직접 API 호출');
        const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session: {
              type: 'realtime',
              model: 'gpt-realtime',
              audio: {
                output: { voice: 'marin' }
              }
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API error:', errorText);
          throw new Error(`Failed to create client secret: ${response.status}`);
        }

        const data = await response.json();
        ephemeralKeyRef.current = data.value;
        return data.value;
      } else {
        // 프로덕션: Supabase Function을 통해 호출
        const { data: { user } } = await supabase.auth.getUser();
        const token = (await supabase.auth.getSession()).data.session?.access_token;

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-client-secret`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Supabase Function error:', errorText);
          throw new Error('Failed to create client secret');
        }
        const { clientSecret } = await response.json();
        ephemeralKeyRef.current = clientSecret;
        return clientSecret;
      }
    } catch (error) {
      console.error('❌ Ephemeral key 생성 오류:', error);
      throw error;
    }
  }, [apiKey]);

  // Audio streamer 설정
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          });
      });
    }
  }, []);

  // Agent 및 Session 설정
  useEffect(() => {
    // instructions가 없거나 비어있으면 스킵 (React Strict Mode에서 첫 실행 시 상태가 아직 업데이트되지 않을 수 있음)
    if (!config.instructions || config.instructions.trim().length === 0) {
      // 디버깅을 위한 로그는 남기되, 경고는 개발 환경에서만 표시
      if (import.meta.env.DEV) {
        console.log('ℹ️ [OpenAI] Instructions not ready yet, waiting for config update...');
      }
      return;
    }

    console.log('🤖 [OpenAI] Creating agent with instructions');
    console.log('📝 [OpenAI] Instructions length:', config.instructions.length);
    console.log('📝 [OpenAI] Instructions preview:', config.instructions.substring(0, 300));
    console.log('🔧 [OpenAI] Tools count:', config.tools?.length || 0);
    
    try {
      // 기존 session과 agent가 있으면 먼저 정리 (중복 Agent 생성 방지)
      if (sessionRef.current) {
        try {
          console.log('🧹 [OpenAI] Cleaning up existing session before creating new one');
          sessionRef.current.close();
        } catch (e) {
          // ignore cleanup errors
        }
        sessionRef.current = null;
      }

      if (agentRef.current) {
        agentRef.current = null;
      }

      // 연결 중 상태도 리셋 (새 Agent 생성 시 기존 연결 무효화)
      connectingRef.current = false;
      setConnected(false);

      const agentConfig = {
        name: 'ReviewAgent',
        instructions: config.instructions,
        tools: config.tools || [],
        model: 'gpt-4o-realtime-preview-2024-12-17'
      };
      
      console.log('🔧 [OpenAI] Agent config:', {
        name: agentConfig.name,
        instructionsLength: agentConfig.instructions?.length || 0,
        toolsCount: agentConfig.tools.length,
        model: agentConfig.model
      });
      
      // Instructions 내용 로깅 (디버깅용)
      if (agentConfig.instructions) {
        console.log('📝 [OpenAI] Instructions preview:', agentConfig.instructions.substring(0, 500));
        
        // Instructions에 "즉시 시작" 지시 확인
        if (!agentConfig.instructions.includes('start the conversation IMMEDIATELY')) {
          console.warn('⚠️ [OpenAI] Instructions may not include immediate start directive');
        }
      }
      
      // Tools 내용 로깅 (디버깅용)
      if (agentConfig.tools.length > 0) {
        console.log('🔧 [OpenAI] Tools:', JSON.stringify(agentConfig.tools, null, 2));
      }

      const agent = new RealtimeAgent(agentConfig as any);

      agentRef.current = agent;

      // Session 생성
      console.log('🔧 [OpenAI] Creating session');
      const session = new RealtimeSession(agent);
      sessionRef.current = session;
      console.log('✅ [OpenAI] Session created');

      // setupEventListeners를 먼저 호출하여 이벤트 핸들러 등록
      setupEventListeners(session);

      setIsInitialized(true);
      setSetupComplete(true);
      console.log('✅ [OpenAI] Agent and session initialized with instructions');
    } catch (error) {
      console.error('❌ [OpenAI] Error creating agent:', error);
    }

    return () => {
      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch (e) {
          console.error('Session close error:', e);
        }
      }
      sessionRef.current = null;
      agentRef.current = null;
      // cleanup에서는 isInitialized를 false로 설정하지 않음 (무한 루프 방지)
    };
  }, [config.instructions, config.tools]); // isInitialized를 의존성에서 제거

  // OpenAI 이벤트를 Gemini 스타일로 변환
  const setupEventListeners = (session: RealtimeSession) => {
    // session.created/updated 이벤트는 RealtimeAgent의 instructions가 자동으로 적용되므로 불필요

    // 오디오 출력 처리
    (session as any).on('response.audio.delta', (data: any) => {
      if (data?.delta && audioStreamerRef.current) {
        const audioData = base64ToArrayBuffer(data.delta);
        audioStreamerRef.current.addPCM16(new Uint8Array(audioData));
      }
    });

    // Speech 이벤트
    (session as any).on('response.speech_started', () => {
      triggerEvent('audio', new ArrayBuffer(0));
      setSetupComplete(true);
    });

    (session as any).on('response.speech_stopped', () => {
      triggerEvent('turncomplete', null);
    });

    // Transcript 이벤트
    (session as any).on('input_audio_buffer.transcript.completed', (data: any) => {
      if (data?.transcript) {
        triggerEvent('content', { text: data.transcript });
      }
    });

    (session as any).on('conversation.item.added', (item: any) => {
      if (item?.role === 'assistant' && item?.content) {
        const text = Array.isArray(item.content)
          ? item.content.map((c: any) => c?.text || '').join(' ')
          : item.content;
        if (text) {
          triggerEvent('content', { text });
        }
      }
    });

    // Tool call 이벤트 (OpenAI는 tool calls를 다르게 처리)
    (session as any).on('response.function_call_arguments_completed', (data: any) => {
      if (data?.function_call) {
        triggerEvent('toolcall', {
          functionCalls: [{
            id: data.function_call.id || Date.now().toString(),
            name: data.function_call.name,
            args: data.function_call.arguments
          }]
        });
      }
    });
  };

  // 이벤트 핸들러 관리 (Gemini 스타일 호환)
  const triggerEvent = (event: string, data: any) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  };

  const connect = useCallback(async () => {
    // 중복 연결 방지
    if (connectingRef.current) {
      console.log('⏸️ [OpenAI] Already connecting, ignoring duplicate call');
      return;
    }

    if (connected) {
      console.log('⏸️ [OpenAI] Already connected, ignoring duplicate call');
      return;
    }

    // Agent가 없으면 에러 (Agent는 config로부터 생성되어야 함)
    if (!agentRef.current) {
      console.error('❌ [OpenAI] Agent not initialized');
      console.log('🔍 [OpenAI] Debug:', {
        hasSession: !!sessionRef.current,
        hasAgent: !!agentRef.current,
        hasInstructions: !!config.instructions,
        isInitialized
      });
      return;
    }

    // Session이 없으면 새로 생성 (재연결 지원)
    if (!sessionRef.current) {
      console.log('🔄 [OpenAI] Creating new session for reconnection...');
      sessionRef.current = new RealtimeSession(agentRef.current);
      setupEventListeners(sessionRef.current);
    }

    connectingRef.current = true;

    try {
      console.log('🔌 [OpenAI] Starting connection...');
      
      let clientSecret = ephemeralKeyRef.current;
      if (!clientSecret) {
        console.log('🔑 [OpenAI] Generating ephemeral key...');
        clientSecret = await generateEphemeralKey();
      }

      console.log('🔗 [OpenAI] Connecting to Realtime API...');
      await sessionRef.current.connect({
        apiKey: clientSecret || ''
      });

      console.log('✅ [OpenAI] Connected successfully');
      setConnected(true);
      
      // Agent instructions에 따라 즉시 응답 생성 (conversation.item.create 없이)
      setTimeout(async () => {
        try {
          console.log('🎤 [OpenAI] Triggering agent to start conversation...');
          const session = sessionRef.current as any;
          const ws = session?.ws || session?._ws || session?.connection?.ws;
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Agent의 instructions에 "즉시 인사하고 시작하라"가 있으므로
            // response.create만 보내면 Agent가 instructions대로 행동함
            ws.send(JSON.stringify({ type: 'response.create' }));
            console.log('✅ [OpenAI] Sent response.create - agent should follow instructions');
          } else {
            console.warn('⚠️ [OpenAI] WebSocket not available');
          }
        } catch (error) {
          console.error('❌ [OpenAI] Error triggering initial response:', error);
        }
      }, 500);

      // Audio recorder 시작
      if (!audioRecorderRef.current) {
        console.log('🎤 [OpenAI] Starting audio recorder...');
        audioRecorderRef.current = new AudioRecorder(16000);
        audioRecorderRef.current.on('data', (base64Audio: string) => {
          if (sessionRef.current) {
            try {
              // OpenAI Realtime API의 audio input 형식으로 전송
              // 주의: ControlTray의 sendRealtimeInput을 통해 오디오가 전송되므로
              // 여기서는 직접 전송하지 않을 수도 있음
              // 하지만 일부 경로에서는 여기서도 전송이 필요할 수 있음
              const session = sessionRef.current as any;
              
              // 방법 1: inputAudioBuffer.append
              if (session.inputAudioBuffer && typeof session.inputAudioBuffer.append === 'function') {
                session.inputAudioBuffer.append({
                  audio: base64Audio
                });
              } 
              // 방법 2: session.append
              else if (session.append && typeof session.append === 'function') {
                session.append({
                  type: 'input_audio_buffer.append',
                  audio: base64Audio
                });
              }
              // 경고 제거 - ControlTray에서 이미 처리하고 있으므로 무시
            } catch (error) {
              console.error('❌ [OpenAI] Error sending audio:', error);
            }
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
  }, [generateEphemeralKey, config.instructions, connected]); // connected 추가

  const disconnect = useCallback(async () => {
    console.log('🔌 [OpenAI] Disconnecting...');
    connectingRef.current = false; // 연결 중 플래그 리셋

    if (audioRecorderRef.current) {
      await audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {
        console.error('Disconnect error:', e);
      }
      sessionRef.current = null;
    }

    // Agent는 유지 (재연결 시 재사용)
    // agentRef.current는 null로 설정하지 않음

    setConnected(false);
    setSetupComplete(false);
    console.log('✅ [OpenAI] Disconnected');
  }, []);

  const setConfig = useCallback((newConfig: LiveConnectConfig | { instructions?: string; tools?: any[] }) => {
    // Gemini 스타일 config인지 확인 (systemInstruction이 있는지)
    if ('systemInstruction' in newConfig || 'responseModalities' in newConfig) {
      console.log('🔄 [OpenAI] Converting Gemini config to OpenAI instructions');
      console.log('📥 [OpenAI] Input config keys:', Object.keys(newConfig));
      
      const converted = convertGeminiConfigToOpenAI(newConfig as LiveConnectConfig);
      
      console.log('✅ [OpenAI] Converted instructions length:', converted.instructions.length);
      console.log('✅ [OpenAI] Converted instructions preview:', converted.instructions.substring(0, 200));
      console.log('✅ [OpenAI] Converted tools count:', converted.tools.length);
      
      if (!converted.instructions || converted.instructions.trim().length === 0) {
        console.error('❌ [OpenAI] Warning: Converted instructions are empty!');
        return; // 빈 instructions가 있으면 설정하지 않음
      }
      
      // 즉시 상태 업데이트 (React의 배치 업데이트를 고려)
      setConfigState(converted);
      console.log('💾 [OpenAI] Config state updated');
    } else {
      // 이미 OpenAI 형식
      console.log('📥 [OpenAI] Direct OpenAI config provided');
      const instructions = (newConfig as any).instructions;
      console.log('📝 [OpenAI] Instructions length:', instructions?.length || 0);
      
      if (!instructions || instructions.trim().length === 0) {
        console.warn('⚠️ [OpenAI] No instructions provided in direct config');
        return;
      }
      
      setConfigState(newConfig as { instructions?: string; tools?: any[] });
      console.log('💾 [OpenAI] Config state updated');
    }
  }, []);

  // Gemini 호환 메서드들
  const send = useCallback((parts: Array<{ text: string }>) => {
    if (!sessionRef.current) {
      console.warn('⚠️ [OpenAI] Session not available for send');
      return;
    }
    
    const text = parts.map(p => p.text).join(' ');
    const session = sessionRef.current as any;
    
    try {
      // OpenAI Realtime API에서 텍스트 메시지를 보내는 방법
      // OpenAI는 주로 오디오 기반이므로, 텍스트는 제한적
      // createResponse가 있으면 호출, 없으면 instructions에 의존
      if (typeof session.createResponse === 'function') {
        console.log('📤 [OpenAI] Triggering response (text will be ignored, using instructions):', text);
        // 인자 없이 호출하면 instructions에 따라 자동으로 응답 생성
        session.createResponse();
      } else {
        // createResponse가 없으면 instructions에 의존
        // Instructions에 "IMMEDIATELY start speaking"이 있으면 자동으로 응답 시작
        console.log('ℹ️ [OpenAI] createResponse 없음 - Instructions에 의존하여 자동 응답');
      }
    } catch (error) {
      console.error('❌ [OpenAI] Error sending message:', error);
    }
  }, []);

  const sendToolResponse = useCallback((response: any) => {
    if (!sessionRef.current) return;
    // OpenAI의 tool response 형식에 맞게 변환 필요
    console.log('Tool response (OpenAI):', response);
  }, []);

  const on = useCallback((event: string, handler: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(handler);
  }, []);

  const off = useCallback((event: string, handler: Function) => {
    eventHandlersRef.current.get(event)?.delete(handler);
  }, []);

  // Gemini GenAILiveClient 스타일의 클라이언트 래퍼
  const clientWrapper = useMemo(() => {
    return {
      session: sessionRef.current,
      send,
      sendToolResponse,
      sendRealtimeInput: (chunks: Array<{ mimeType: string; data: string }>) => {
        // ControlTray에서 호출하는 sendRealtimeInput 지원
        if (!sessionRef.current) return;
        const session = sessionRef.current as any;
        
        chunks.forEach((chunk) => {
          if (chunk.mimeType.includes('audio')) {
            // Audio input 처리 - OpenAI RealtimeSession의 실제 API 사용
            try {
              // 방법 1: inputAudioBuffer.append (가장 일반적)
              if (session.inputAudioBuffer && typeof session.inputAudioBuffer.append === 'function') {
                session.inputAudioBuffer.append({
                  audio: chunk.data
                });
              } 
              // 방법 2: session의 append 메서드 (일부 버전)
              else if (session.append && typeof session.append === 'function') {
                session.append({
                  type: 'input_audio_buffer.append',
                  audio: chunk.data
                });
              }
              // 방법 3: 직접 내부 메서드 호출 (폴백)
              else if ((session as any)._sendAudioInput || (session as any).sendAudioInput) {
                const sendAudioMethod = (session as any)._sendAudioInput || (session as any).sendAudioInput;
                if (typeof sendAudioMethod === 'function') {
                  sendAudioMethod(chunk.data);
                }
              } else {
                // 경고 로그 제거 - ControlTray에서 이미 오디오를 전송하고 있으므로
                // 이 경로는 실제로 사용되지 않을 수 있음
              }
            } catch (error) {
              console.error('❌ [OpenAI] Error sending audio input:', error);
            }
          }
        });
      },
      createResponse: async () => {
        const session = sessionRef.current as any;
        if (!session) {
          console.warn('⚠️ [OpenAI] No session available for createResponse');
          return;
        }
        
        console.log('🎤 [OpenAI] createResponse 호출됨');
        
        try {
          // sendMessage 메서드 사용
          if (typeof session.sendMessage === 'function') {
            console.log('📤 [OpenAI] sendMessage 메서드 사용');
            await session.sendMessage('Continue the conversation.');
            console.log('✅ [OpenAI] 메시지 전송 완료');
          } else {
            console.warn('⚠️ [OpenAI] sendMessage 메서드 없음');
          }
        } catch (error) {
          console.error('❌ [OpenAI] Error creating response:', error);
        }
      },
      on,
      off,
      connect,
      disconnect,
      status: connected ? 'connected' : 'disconnected',
    } as any;
  }, [send, sendToolResponse, on, off, connect, disconnect, connected]);

  return {
    client: clientWrapper,
    agent: agentRef.current,
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
    off,
  };
}

// Base64를 ArrayBuffer로 변환
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

