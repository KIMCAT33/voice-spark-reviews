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

import {
  Content,
  GoogleGenAI,
  LiveCallbacks,
  LiveClientToolResponse,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerMessage,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
  Session,
} from "@google/genai";

import { EventEmitter } from "eventemitter3";
import { difference } from "lodash";
import { LiveClientOptions, StreamingLog } from "../types";
import { base64ToArrayBuffer } from "./utils";

/**
 * Event types that can be emitted by the MultimodalLiveClient.
 * Each event corresponds to a specific message from GenAI or client state change.
 */
export interface LiveClientEventTypes {
  // Emitted when audio data is received
  audio: (data: ArrayBuffer) => void;
  // Emitted when the connection closes
  close: (event: CloseEvent) => void;
  // Emitted when content is received from the server
  content: (data: LiveServerContent) => void;
  // Emitted when an error occurs
  error: (error: ErrorEvent) => void;
  // Emitted when the server interrupts the current generation
  interrupted: () => void;
  // Emitted for logging events
  log: (log: StreamingLog) => void;
  // Emitted when the connection opens
  open: () => void;
  // Emitted when the initial setup is complete
  setupcomplete: () => void;
  // Emitted when a tool call is received
  toolcall: (toolCall: LiveServerToolCall) => void;
  // Emitted when a tool call is cancelled
  toolcallcancellation: (
    toolcallCancellation: LiveServerToolCallCancellation
  ) => void;
  // Emitted when the current turn is complete
  turncomplete: () => void;
}

/**
 * A event-emitting class that manages the connection to the websocket and emits
 * events to the rest of the application.
 * If you dont want to use react you can still use this.
 */
export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  protected client: GoogleGenAI;
  private useProxy: boolean = false;
  private proxyUrl: string = '';

  private _status: "connected" | "disconnected" | "connecting" = "disconnected";
  public get status() {
    return this._status;
  }

  private _session: Session | null = null;
  private _ws: WebSocket | null = null; // Direct WebSocket for proxy mode
  public get session() {
    return this._session;
  }

  private _model: string | null = null;
  public get model() {
    return this._model;
  }

  protected config: LiveConnectConfig | null = null;

  public getConfig() {
    return { ...this.config };
  }

  constructor(options: LiveClientOptions & { useProxy?: boolean; proxyUrl?: string }) {
    super();
    this.client = new GoogleGenAI(options);
    this.useProxy = options.useProxy || false;
    this.proxyUrl = options.proxyUrl || '';
    this.send = this.send.bind(this);
    this.onopen = this.onopen.bind(this);
    this.onerror = this.onerror.bind(this);
    this.onclose = this.onclose.bind(this);
    this.onmessage = this.onmessage.bind(this);
  }

  protected log(type: string, message: StreamingLog["message"]) {
    const log: StreamingLog = {
      date: new Date(),
      type,
      message,
    };
    this.emit("log", log);
  }

  async connect(model: string, config: LiveConnectConfig): Promise<boolean> {
    console.log("🔗 Starting connection with model:", model);
    console.log("Config:", config);
    console.log("Use proxy:", this.useProxy);
    
    if (this._status === "connected" || this._status === "connecting") {
      console.warn("Already connected or connecting, returning false");
      return false;
    }

    this._status = "connecting";
    this.config = config;
    this._model = model;

    // Use proxy mode if configured
    if (this.useProxy && this.proxyUrl) {
      return this.connectViaProxy(model, config);
    }

    // Original Google SDK connection
    const callbacks: LiveCallbacks = {
      onopen: this.onopen,
      onmessage: this.onmessage,
      onerror: this.onerror,
      onclose: this.onclose,
    };

    try {
      console.log("🚀 Calling client.live.connect...");
      this._session = await this.client.live.connect({
        model,
        config,
        callbacks,
      });
      console.log("✅ Session created:", this._session ? "YES" : "NO");
    } catch (e) {
      console.error("❌ Error connecting to GenAI Live:", e);
      this._status = "disconnected";
      return false;
    }

    this._status = "connected";
    console.log("✅ Status set to connected");
    return true;
  }

  private async connectViaProxy(model: string, config: LiveConnectConfig): Promise<boolean> {
    try {
      const wsUrl = `${this.proxyUrl}?model=${encodeURIComponent(model)}`;
      console.log("🔗 Connecting via proxy:", wsUrl);
      
      this._ws = new WebSocket(wsUrl);
      
      this._ws.onopen = () => {
        console.log("✅ Proxy WebSocket opened");
        this._status = "connected";
        this.onopen();
        
        // Send initial setup message with config
        const setupMessage = {
          setup: {
            model,
            ...config
          }
        };
        this._ws?.send(JSON.stringify(setupMessage));
      };
      
      this._ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.onmessage(message);
        } catch (error) {
          console.error("Error parsing proxy message:", error);
        }
      };
      
      this._ws.onerror = (event) => {
        console.error("❌ Proxy WebSocket error:", event);
        this.onerror(event as ErrorEvent);
      };
      
      this._ws.onclose = (event) => {
        console.log("🔌 Proxy WebSocket closed");
        this._status = "disconnected";
        this.onclose(event);
      };
      
      return true;
    } catch (error) {
      console.error("❌ Error connecting via proxy:", error);
      this._status = "disconnected";
      return false;
    }
  }

  public disconnect() {
    if (this.useProxy && this._ws) {
      this._ws.close();
      this._ws = null;
      this._status = "disconnected";
      this.log("client.close", `Disconnected from proxy`);
      return true;
    }
    
    if (!this.session) {
      return false;
    }
    this.session?.close();
    this._session = null;
    this._status = "disconnected";

    this.log("client.close", `Disconnected`);
    return true;
  }

  protected onopen() {
    console.log("🌐 WebSocket OPENED");
    this.log("client.open", "Connected");
    this.emit("open");
  }

  protected onerror(e: ErrorEvent) {
    console.error("❌ WebSocket ERROR:", e);
    console.error("Error message:", e.message);
    console.error("Error type:", e.type);
    this.log("server.error", e.message);
    this.emit("error", e);
  }

  protected onclose(e: CloseEvent) {
    console.warn("🔌 WebSocket CLOSED");
    console.warn("Close code:", e.code);
    console.warn("Close reason:", e.reason);
    console.warn("Was clean:", e.wasClean);
    this.log(
      `server.close`,
      `disconnected ${e.reason ? `with reason: ${e.reason}` : ``}`
    );
    this.emit("close", e);
  }

  protected async onmessage(message: LiveServerMessage) {
    console.log("📨 Message received:", message);
    
    if (message.setupComplete) {
      console.log("✅ SETUP COMPLETE received!");
      this.log("server.send", "setupComplete");
      this.emit("setupcomplete");
      return;
    }
    if (message.toolCall) {
      this.log("server.toolCall", message);
      this.emit("toolcall", message.toolCall);
      return;
    }
    if (message.toolCallCancellation) {
      this.log("server.toolCallCancellation", message);
      this.emit("toolcallcancellation", message.toolCallCancellation);
      return;
    }

    // this json also might be `contentUpdate { interrupted: true }`
    // or contentUpdate { end_of_turn: true }
    if (message.serverContent) {
      const { serverContent } = message;
      if ("interrupted" in serverContent) {
        this.log("server.content", "interrupted");
        this.emit("interrupted");
        return;
      }
      if ("turnComplete" in serverContent) {
        this.log("server.content", "turnComplete");
        this.emit("turncomplete");
      }

      if ("modelTurn" in serverContent) {
        let parts: Part[] = serverContent.modelTurn?.parts || [];

        // when its audio that is returned for modelTurn
        const audioParts = parts.filter(
          (p) => p.inlineData && p.inlineData.mimeType?.startsWith("audio/pcm")
        );
        const base64s = audioParts.map((p) => p.inlineData?.data);

        // strip the audio parts out of the modelTurn
        const otherParts = difference(parts, audioParts);
        // console.log("otherParts", otherParts);

        base64s.forEach((b64) => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit("audio", data);
            this.log(`server.audio`, `buffer (${data.byteLength})`);
          }
        });
        if (!otherParts.length) {
          return;
        }

        parts = otherParts;

        const content: { modelTurn: Content } = { modelTurn: { parts } };
        this.emit("content", content);
        this.log(`server.content`, message);
      }
    } else {
      console.log("received unmatched message", message);
    }
  }

  /**
   * send realtimeInput, this is base64 chunks of "audio/pcm" and/or "image/jpg"
   */
  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this.useProxy && this._ws) {
      // Send via proxy WebSocket
      const message = {
        realtimeInput: { mediaChunks: chunks }
      };
      this._ws.send(JSON.stringify(message));
      this.log(`client.realtimeInput`, `sent ${chunks.length} chunks via proxy`);
      return;
    }
    
    if (!this.session) {
      console.warn("Cannot send realtime input: session not available");
      return;
    }
    let hasAudio = false;
    let hasVideo = false;
    for (const ch of chunks) {
      try {
        this.session.sendRealtimeInput({ media: ch });
        if (ch.mimeType.includes("audio")) {
          hasAudio = true;
        }
        if (ch.mimeType.includes("image")) {
          hasVideo = true;
        }
        if (hasAudio && hasVideo) {
          break;
        }
      } catch (error) {
        console.error("Error sending realtime input:", error);
      }
    }
    const message =
      hasAudio && hasVideo
        ? "audio + video"
        : hasAudio
        ? "audio"
        : hasVideo
        ? "video"
        : "unknown";
    this.log(`client.realtimeInput`, message);
  }

  /**
   *  send a response to a function call and provide the id of the functions you are responding to
   */
  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this.useProxy && this._ws) {
      // Send via proxy WebSocket
      const message = {
        toolResponse: toolResponse
      };
      this._ws.send(JSON.stringify(message));
      this.log(`client.toolResponse`, toolResponse);
      return;
    }
    
    if (
      toolResponse.functionResponses &&
      toolResponse.functionResponses.length
    ) {
      this.session?.sendToolResponse({
        functionResponses: toolResponse.functionResponses,
      });
      this.log(`client.toolResponse`, toolResponse);
    }
  }

  /**
   * send normal content parts such as { text }
   */
  send(parts: Part | Part[], turnComplete: boolean = true) {
    if (!this.session) {
      console.warn("Cannot send content: session not available");
      return;
    }
    if (this._status !== "connected") {
      console.warn(`Cannot send content: status is ${this._status}`);
      return;
    }
    try {
      this.session.sendClientContent({ turns: parts, turnComplete });
      this.log(`client.send`, {
        turns: Array.isArray(parts) ? parts : [parts],
        turnComplete,
      });
    } catch (error) {
      console.error("Error sending content:", error);
    }
  }
}
