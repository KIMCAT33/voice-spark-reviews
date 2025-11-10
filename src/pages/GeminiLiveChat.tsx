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

import { useRef, useState } from "react";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { ReviewAgent } from "../components/review-agent/ReviewAgent";
import ControlTray from "../components/control-tray/ControlTray";
import { LiveClientOptions } from "../types";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Support both VITE_ and REACT_APP_ prefixes for compatibility
const API_KEY = (
  import.meta.env.VITE_GEMINI_API_KEY || 
  import.meta.env.REACT_APP_GEMINI_API_KEY ||
  (typeof process !== "undefined" && process.env?.VITE_GEMINI_API_KEY) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_GEMINI_API_KEY)
) as string;

if (!API_KEY || typeof API_KEY !== "string" || API_KEY.trim() === "") {
  console.error("API Key not configured");
}

const trimmedAPIKey = API_KEY?.trim() || "";

const apiOptions: LiveClientOptions = {
  apiKey: trimmedAPIKey,
};

function GeminiLiveChat() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  if (!trimmedAPIKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">API Key Missing</h1>
          <p className="text-muted-foreground">
            Please add your Gemini API key to the .env file
          </p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
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

      <LiveAPIProvider options={apiOptions}>
        <div className="flex flex-col h-screen relative z-10">
          {/* Header with Glassmorphism */}
          <div className="p-3 xs:p-4 border-b border-border/30 bg-background/60 backdrop-blur-xl shadow-sm">
            <div className="container mx-auto">
              {/* Mobile Layout */}
              <div className="flex md:hidden items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="hover:bg-primary/10 transition-colors flex-shrink-0 px-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span className="text-xs xs:text-sm">Back to Purchase</span>
                </Button>
                <h1 className="text-xs xs:text-sm font-bold text-primary text-right leading-tight flex-1 min-w-0 break-words">
                  Customer Service Review Call
                </h1>
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
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
            </div>
          </div>

          {/* Main Content with Animation */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
              <div className="w-full max-w-5xl">
                <ReviewAgent />
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
