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
import "../pages/GeminiApp.scss";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import SidePanel from "../components/side-panel/SidePanel";
import { ReviewAgent } from "../components/review-agent/ReviewAgent";
import ControlTray from "../components/control-tray/ControlTray";
import cn from "classnames";
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
  console.error("API Key not found. Available env vars:", {
    "import.meta.env.VITE_GEMINI_API_KEY": import.meta.env.VITE_GEMINI_API_KEY,
    "import.meta.env.REACT_APP_GEMINI_API_KEY": import.meta.env.REACT_APP_GEMINI_API_KEY,
  });
}

const trimmedAPIKey = API_KEY?.trim() || "";
console.log("API Key loaded:", trimmedAPIKey.substring(0, 10) + "...");

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
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
              <div className="fixed top-4 left-4 z-50">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
              
              {/* Beauty Product Review Collection Agent */}
              <ReviewAgent />
              <video
                className={cn("stream", {
                  hidden: !videoRef.current || !videoStream,
                })}
                ref={videoRef}
                autoPlay
                playsInline
              />
            </div>

            <ControlTray
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              enableEditingSettings={true}
            >
              {/* put your own buttons here */}
            </ControlTray>
          </main>
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default GeminiLiveChat;
