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

import { useRef, useState, useEffect } from "react";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { ReviewAgent } from "../components/review-agent/ReviewAgent";
import ControlTray from "../components/control-tray/ControlTray";
import { LiveClientOptions } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StepProgressBar } from "@/components/StepProgressBar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Vite only exposes environment variables prefixed with VITE_
// 러버블에서는 Secrets를 프로젝트 설정에서 추가해야 합니다
// 러버블 Secrets가 빌드 타임에 주입되지 않는 경우를 대비하여 런타임에도 확인

// 러버블 빌드 환경에서 사용 가능한 모든 환경 변수 소스 확인
// 빈 문자열 체크도 포함 (러버블 Secrets가 빈 값으로 주입될 수 있음)
const GEMINI_API_KEY = 
  (import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY.trim()) || 
  (import.meta.env.GEMINI_API_KEY && import.meta.env.GEMINI_API_KEY.trim()) ||
  null;

const OPENAI_API_KEY = 
  (import.meta.env.VITE_OPENAI_API_KEY && import.meta.env.VITE_OPENAI_API_KEY.trim()) || 
  (import.meta.env.OPENAI_API_KEY && import.meta.env.OPENAI_API_KEY.trim()) ||
  null;

// 프로덕션 및 개발 환경에서 디버깅 (러버블에서 환경 변수가 제대로 주입되는지 확인)
if (typeof window !== 'undefined') {
  const hasGemini = !!GEMINI_API_KEY;
  const hasOpenAI = !!OPENAI_API_KEY;
  
  if (!hasGemini || !hasOpenAI) {
    // 환경 변수 디버깅 정보 (API 키 값은 노출하지 않음)
    const allEnvKeys = Object.keys(import.meta.env);
    const relevantEnvKeys = allEnvKeys
      .filter(k => k.includes('GEMINI') || k.includes('OPENAI') || k.includes('VITE_'))
      .slice(0, 20);
    
    // 모든 환경 변수 키 목록 (값은 제외)
    const envKeysList = allEnvKeys.slice(0, 20);
    
    // 환경 변수 값 확인 (키는 존재하지만 값이 빈 문자열일 수 있음)
    const geminiKeyValue = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    const openAIKeyValue = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    
    console.warn('⚠️ API Keys not found. Available environment variables:', {
      hasGemini,
      hasOpenAI,
      relevantEnvKeys,
      allEnvKeysPreview: envKeysList,
      totalEnvKeys: allEnvKeys.length,
      mode: import.meta.env.MODE,
      prod: import.meta.env.PROD,
      dev: import.meta.env.DEV,
      // 러버블 빌드 환경 확인을 위한 추가 정보
      baseUrl: import.meta.env.BASE_URL,
      viteVersion: import.meta.env.VITE_VERSION,
      // 환경 변수 값 상태 확인 (실제 값은 노출하지 않음)
      geminiKeyExists: !!geminiKeyValue,
      geminiKeyLength: geminiKeyValue ? geminiKeyValue.length : 0,
      geminiKeyIsEmpty: geminiKeyValue === '',
      openAIKeyExists: !!openAIKeyValue,
      openAIKeyLength: openAIKeyValue ? openAIKeyValue.length : 0,
      openAIKeyIsEmpty: openAIKeyValue === '',
    });
    
    // 러버블 Secrets가 제대로 주입되지 않을 경우를 위한 안내
    if (import.meta.env.PROD) {
      console.error('❌ 러버블에서 환경 변수가 주입되지 않았습니다.', {
        suggestion: '러버블 프로젝트 설정 → Secrets에서 VITE_GEMINI_API_KEY와 VITE_OPENAI_API_KEY를 확인하세요.',
        note: '빌드 타임에 주입되어야 하므로, Secrets 변경 후 재배포가 필요합니다.',
      });
    }
  }
}

export type AIModel = "gemini" | "openai";

// Trim API keys (empty string if not provided)
const trimmedGeminiKey = GEMINI_API_KEY?.trim() || "";
const trimmedOpenAIKey = OPENAI_API_KEY?.trim() || "";

const geminiApiOptions: LiveClientOptions = {
  apiKey: trimmedGeminiKey,
};

function GeminiLiveChat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [runtimeApiKeys, setRuntimeApiKeys] = useState<{ gemini?: string; openai?: string } | null>(null);
  
  // 러버블 Secrets가 빌드 타임에 주입되지 않는 경우를 대비하여 런타임에 확인
  // 러버블이 window 객체에 환경 변수를 주입하는지 확인
  useEffect(() => {
    // 러버블이 window.__LOVABLE_ENV__ 같은 객체로 환경 변수를 주입할 수 있음
    const lovableEnv = (window as any).__LOVABLE_ENV__ || (window as any).__ENV__ || {};
    
    if (!GEMINI_API_KEY || !OPENAI_API_KEY) {
      // 러버블 런타임 환경 변수 확인
      const runtimeGemini = (lovableEnv.VITE_GEMINI_API_KEY && lovableEnv.VITE_GEMINI_API_KEY.trim()) || 
                            (lovableEnv.GEMINI_API_KEY && lovableEnv.GEMINI_API_KEY.trim());
      const runtimeOpenAI = (lovableEnv.VITE_OPENAI_API_KEY && lovableEnv.VITE_OPENAI_API_KEY.trim()) || 
                            (lovableEnv.OPENAI_API_KEY && lovableEnv.OPENAI_API_KEY.trim());
      
      if (runtimeGemini || runtimeOpenAI) {
        setRuntimeApiKeys({
          gemini: runtimeGemini || undefined,
          openai: runtimeOpenAI || undefined,
        });
        console.log('✅ 러버블 런타임 환경 변수에서 API 키를 찾았습니다.');
      }
    }
  }, []);
  
  // Get selected model from URL or default to "gemini"
  const modelParam = searchParams.get('model') as AIModel;
  const [selectedModel, setSelectedModel] = useState<AIModel>(
    (modelParam === "gemini" || modelParam === "openai") ? modelParam : "gemini"
  );

  // Update URL when model changes
  useEffect(() => {
    if (selectedModel !== modelParam) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('model', selectedModel);
      setSearchParams(newParams, { replace: true });
    }
  }, [selectedModel, modelParam, searchParams, setSearchParams]);
  
  // Get products and customer info from URL parameters
  const productsParam = searchParams.get('products');
  const productParam = searchParams.get('product'); // Backward compatibility
  const customerParam = searchParams.get('customer');
  
  // Generate a random guest name if customer name is not provided (for demo purposes)
  const generateGuestName = () => {
    const guestNames = [
      'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Avery',
      'Jamie', 'Quinn', 'Dakota', 'Skylar', 'Cameron', 'Blake', 'Reese', 'Sage'
    ];
    const randomIndex = Math.floor(Math.random() * guestNames.length);
    return `Guest ${guestNames[randomIndex]}`;
  };
  
  const customerName = customerParam || generateGuestName();
  
  // Parse products from URL or use single product (backward compatibility)
  let products = [{ name: 'VOIX Beauty Product', price: '0' }];
  if (productsParam) {
    try {
      products = JSON.parse(decodeURIComponent(productsParam));
    } catch (error) {
      console.error("Failed to parse products from URL:", error);
      // Use default products on parse error
    }
  } else if (productParam) {
    products = [{ name: productParam, price: '0' }];
  }

  // 런타임 API 키가 있으면 사용, 없으면 빌드 타임 환경 변수 사용
  const finalGeminiKey = runtimeApiKeys?.gemini || trimmedGeminiKey;
  const finalOpenAIKey = runtimeApiKeys?.openai || trimmedOpenAIKey;
  
  // Check if API key is available for selected model
  const hasRequiredAPIKey = selectedModel === "gemini" 
    ? !!finalGeminiKey 
    : !!finalOpenAIKey;

  if (!hasRequiredAPIKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">API Key Missing</h1>
          <p className="text-muted-foreground">
            The {selectedModel === "gemini" ? "Gemini" : "OpenAI"} API key is not configured.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
            <p className="font-semibold">To fix this in Lovable:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to your Lovable project settings</li>
              <li>Navigate to "Secrets" or "Environment Variables"</li>
              <li>Add: <code className="bg-background px-1 rounded">{selectedModel === "gemini" ? "VITE_GEMINI_API_KEY" : "VITE_OPENAI_API_KEY"}</code></li>
              <li>Set the value to your API key</li>
              <li>Save and redeploy</li>
            </ol>
          </div>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => setSelectedModel(selectedModel === "gemini" ? "openai" : "gemini")}>
              Switch to {selectedModel === "gemini" ? "OpenAI" : "Gemini"}
            </Button>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <LiveAPIProvider 
        options={{
          ...geminiApiOptions,
          apiKey: finalGeminiKey, // 런타임 API 키 우선 사용
        }}
        modelType={selectedModel}
        openAIApiKey={finalOpenAIKey} // 런타임 API 키 우선 사용
      >
        <div className="flex flex-col h-screen relative z-10">
          {/* Header with Glassmorphism */}
          <div className="p-3 xs:p-4 border-b border-border/30 bg-background/60 backdrop-blur-xl shadow-sm">
            <div className="container mx-auto space-y-3">
              {/* Mobile Layout */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/purchase")}
                  className="hover:bg-primary/10 transition-colors flex-shrink-0 px-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-xs xs:text-sm">Back</span>
                </Button>
                <h1 className="text-xs xs:text-sm font-bold text-primary text-right leading-tight flex-1 min-w-0 break-words">
                  Customer Service Review Call
                </h1>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/purchase")}
                  className="hover:bg-primary/10 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Purchase
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Customer Service Review Call
                </h1>
                <div className="w-32"></div>
              </div>

              {/* Model Selection */}
              <div className="flex items-center gap-3">
                <Label htmlFor="model-select" className="text-sm font-medium whitespace-nowrap">
                  AI Model:
                </Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value) => setSelectedModel(value as AIModel)}
                >
                  <SelectTrigger id="model-select" className="w-[180px]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini" disabled={!trimmedGeminiKey}>
                      {trimmedGeminiKey ? "🤖 Gemini" : "🤖 Gemini (API key missing)"}
                    </SelectItem>
                    <SelectItem value="openai" disabled={!trimmedOpenAIKey}>
                      {trimmedOpenAIKey ? "⚡ OpenAI" : "⚡ OpenAI (API key missing)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress Bar */}
              <Card className="p-4 bg-background/80 backdrop-blur-sm">
                <StepProgressBar 
                  current={2} 
                  total={3} 
                  label="Step 2/3: Sharing Your Feedback"
                  steps={["Purchase Complete", "Sharing Your Feedback", "View Dashboard"]}
                />
              </Card>
            </div>
          </div>

          {/* Main Content with Animation */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
              <div className="w-full max-w-5xl">
                <ReviewAgent products={products} customerName={customerName} />
              </div>
            </div>
          </div>

          {/* Control Tray with Glassmorphism */}
          <div className="border-t border-border/30 bg-background/60 backdrop-blur-xl shadow-lg">
            <ControlTray
              videoRef={videoRef}
              supportsVideo={false}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={false}
            />
          </div>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default GeminiLiveChat;
