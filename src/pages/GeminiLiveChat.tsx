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
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export type AIModel = "gemini" | "openai";

function GeminiLiveChat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [apiKeys, setApiKeys] = useState<{ gemini?: string; openai?: string }>({});
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [keyError, setKeyError] = useState<string | null>(null);
  
  // Fetch API keys from Edge Functions
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setIsLoadingKeys(true);
        setKeyError(null);
        
        const [geminiResponse, openaiResponse] = await Promise.all([
          supabase.functions.invoke('get-gemini-key'),
          supabase.functions.invoke('get-openai-key')
        ]);
        
        const keys: { gemini?: string; openai?: string } = {};
        
        if (geminiResponse.data?.apiKey) {
          keys.gemini = geminiResponse.data.apiKey;
          console.log('✅ Successfully fetched Gemini API key');
        } else {
          console.error('❌ Failed to fetch Gemini API key:', geminiResponse.error);
        }
        
        if (openaiResponse.data?.apiKey) {
          keys.openai = openaiResponse.data.apiKey;
          console.log('✅ Successfully fetched OpenAI API key');
        } else {
          console.error('❌ Failed to fetch OpenAI API key:', openaiResponse.error);
        }
        
        setApiKeys(keys);
        
        if (!keys.gemini && !keys.openai) {
          setKeyError('API keys not configured in Lovable Secrets');
        }
      } catch (error) {
        console.error('Error fetching API keys:', error);
        setKeyError('Failed to fetch API keys');
      } finally {
        setIsLoadingKeys(false);
      }
    };
    
    fetchApiKeys();
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

  
  // Check if API key is available for selected model
  const hasRequiredApiKey = selectedModel === "gemini" 
    ? !!apiKeys.gemini 
    : !!apiKeys.openai;

  if (!hasRequiredApiKey) {
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
          apiKey: selectedModel === "gemini" ? (apiKeys.gemini || "") : "",
        }}
        modelType={selectedModel}
        openAIApiKey={selectedModel === "openai" ? (apiKeys.openai || "") : ""}
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
                    <SelectItem value="gemini" disabled={!apiKeys.gemini}>
                      {apiKeys.gemini ? "🤖 Gemini" : "🤖 Gemini (API key missing)"}
                    </SelectItem>
                    <SelectItem value="openai" disabled={!apiKeys.openai}>
                      {apiKeys.openai ? "⚡ OpenAI" : "⚡ OpenAI (API key missing)"}
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
