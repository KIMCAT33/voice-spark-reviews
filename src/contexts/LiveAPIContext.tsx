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

import { createContext, FC, ReactNode, useContext, useMemo } from "react";
import { useLiveAPI, UseLiveAPIResults } from "../hooks/use-live-api";
import { useOpenAIRealtime, UseOpenAIRealtimeResults } from "../hooks/use-openai-realtime";
import { LiveClientOptions } from "../types";

// 통합 인터페이스 타입 (Gemini와 OpenAI 모두 지원)
type UnifiedLiveAPIResults = UseLiveAPIResults | UseOpenAIRealtimeResults;

const LiveAPIContext = createContext<UnifiedLiveAPIResults | undefined>(undefined);

export type AIModel = "gemini" | "openai";

export type LiveAPIProviderProps = {
  children: ReactNode;
  options: LiveClientOptions;
  modelType?: AIModel;
  openAIApiKey?: string;
};

export const LiveAPIProvider: FC<LiveAPIProviderProps> = ({
  options,
  children,
  modelType = "gemini",
  openAIApiKey,
}) => {
  // 모델 타입에 따라 적절한 Hook 사용
  const geminiAPI = useLiveAPI(options);
  const openAIAPI = useOpenAIRealtime();

  // 선택한 모델에 따라 적절한 API 반환
  const liveAPI = useMemo(() => {
    if (modelType === "openai") {
      // OpenAI API를 Gemini 스타일로 래핑 (호환성 유지)
      return {
        ...openAIAPI,
        // Gemini 인터페이스와 호환되도록 필요한 경우 변환
        client: openAIAPI.client as any,
      } as any;
    }
    return geminiAPI;
  }, [modelType, geminiAPI, openAIAPI]);

  return (
    <LiveAPIContext.Provider value={liveAPI}>
      {children}
    </LiveAPIContext.Provider>
  );
};

export const useLiveAPIContext = () => {
  const context = useContext(LiveAPIContext);
  if (!context) {
    throw new Error("useLiveAPIContext must be used wihin a LiveAPIProvider");
  }
  return context;
};
