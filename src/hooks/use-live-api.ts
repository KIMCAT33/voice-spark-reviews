/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  setupComplete: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [model, setModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
      setSetupComplete(false);
    };

    const onClose = () => {
      setConnected(false);
      setSetupComplete(false);
    };

    const onSetupComplete = () => {
      setSetupComplete(true);
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("setupcomplete", onSetupComplete)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("setupcomplete", onSetupComplete)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .disconnect();
    };
  }, [client]);

  const connect = useCallback(async () => {
    if (!config) {
      throw new Error("config has not been set");
    }
    
    console.log("🎯 Connect called - attempting to activate audio...");
    
    // CRITICAL: Resume audio context BEFORE connecting
    // This must happen in the user gesture handler (button click)
    if (audioStreamerRef.current) {
      console.log("🔊 Audio context state before resume:", audioStreamerRef.current.context.state);
      
      // Force resume multiple times to ensure activation
      for (let i = 0; i < 3; i++) {
        await audioStreamerRef.current.context.resume();
        console.log(`🔊 Resume attempt ${i + 1}, state:`, audioStreamerRef.current.context.state);
        
        if (audioStreamerRef.current.context.state === "running") {
          console.log("✅ Audio context successfully activated!");
          break;
        }
        
        // Wait a bit before next attempt
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Final check
      if (audioStreamerRef.current.context.state !== "running") {
        console.error("❌ Failed to activate audio context. State:", audioStreamerRef.current.context.state);
        throw new Error("오디오를 활성화할 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.");
      }
      
      // Test audio by playing a short silent buffer
      const testBuffer = audioStreamerRef.current.context.createBuffer(1, 1, audioStreamerRef.current.context.sampleRate);
      const testSource = audioStreamerRef.current.context.createBufferSource();
      testSource.buffer = testBuffer;
      testSource.connect(audioStreamerRef.current.context.destination);
      testSource.start();
      console.log("✅ Test audio played successfully");
    }
    
    client.disconnect();
    await client.connect(model, config);
    console.log("✅ Connection established");
  }, [client, config, model]);

  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
  }, [setConnected, client]);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    setupComplete,
    connect,
    disconnect,
    volume,
  };
}
