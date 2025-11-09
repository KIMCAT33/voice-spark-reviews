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
import "./App.scss";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import { ReviewAgent } from "./components/review-agent/ReviewAgent";
import ControlTray from "./components/control-tray/ControlTray";
import cn from "classnames";
import { LiveClientOptions } from "./types";

// Support both VITE_ and REACT_APP_ prefixes for compatibility
// Vite uses import.meta.env, but we also check process.env for compatibility
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
    "process.env.VITE_GEMINI_API_KEY": typeof process !== "undefined" ? process.env?.VITE_GEMINI_API_KEY : "N/A",
    "process.env.REACT_APP_GEMINI_API_KEY": typeof process !== "undefined" ? process.env?.REACT_APP_GEMINI_API_KEY : "N/A",
  });
  throw new Error("set VITE_GEMINI_API_KEY or REACT_APP_GEMINI_API_KEY in .env");
}
const trimmedAPIKey = API_KEY.trim();
console.log("API Key loaded:", trimmedAPIKey.substring(0, 10) + "...");

const apiOptions: LiveClientOptions = {
  apiKey: trimmedAPIKey,
};

function App() {
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <div className="App">
      <LiveAPIProvider options={apiOptions}>
        <div className="streaming-console">
          <SidePanel />
          <main>
            <div className="main-app-area">
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

export default App;
