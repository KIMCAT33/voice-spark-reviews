import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Phone, PhoneOff, Loader2 } from "lucide-react";
import VoiceWaveform from "./VoiceWaveform";
import TranscriptionDisplay from "./TranscriptionDisplay";
import ReviewSummary from "./ReviewSummary";
import { useNavigate } from "react-router-dom";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { AudioRecorder } from "@/lib/audio-recorder";
import { Type, FunctionDeclaration } from "@google/genai";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VoiceReviewProps {
  onBack: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ReviewData {
  product_name: string;
  customer_emotion: string;
  key_positive_points: string[];
  key_negative_points: string[];
  improvement_suggestions: string[];
  review_summary: string;
  recommendation_score: number;
}

// Define the function declaration outside component to avoid recreation
const endReviewDeclaration: FunctionDeclaration = {
  name: "end_review",
  description: "Call this function when you have gathered enough feedback to complete the review. Include all structured data about the customer's experience.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      product_name: {
        type: Type.STRING,
        description: "Name of the product being reviewed"
      },
      customer_emotion: {
        type: Type.STRING,
        description: "Overall customer emotion: satisfied, neutral, or frustrated"
      },
      key_positive_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of positive feedback points"
      },
      key_negative_points: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of negative feedback points or concerns"
      },
      improvement_suggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Suggestions for product improvement"
      },
      review_summary: {
        type: Type.STRING,
        description: "A brief summary of the customer's overall feedback"
      },
      recommendation_score: {
        type: Type.NUMBER,
        description: "Likelihood to recommend (1-5 scale)"
      }
    },
    required: ["product_name", "customer_emotion", "review_summary", "recommendation_score"]
  }
};

const VoiceReview = ({ onBack }: VoiceReviewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { client, connected, connect, disconnect, setConfig, setModel } = useLiveAPIContext();
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const currentTranscriptRef = useRef<string>("");

  // Initialize Gemini configuration
  useEffect(() => {
    setModel("models/gemini-2.0-flash-exp");
    setConfig({
      systemInstruction: {
        parts: [{
          text: `You are a friendly customer service representative conducting a post-purchase review call for VOIX. 

CRITICAL INSTRUCTIONS:
1. START IMMEDIATELY with a warm greeting when the customer says hello: "Hi! Thanks so much for taking the time to share your thoughts about your recent purchase. I'd love to hear about your experience!"
2. Ask about their experience with the product they purchased
3. Listen actively and ask 2-3 follow-up questions to understand their feedback deeply
4. When you have gathered enough information (positive points, negative points, and overall sentiment), call the end_review function with the structured data
5. Keep the conversation natural and conversational - like a real CS team member

Guidelines:
- Be warm, enthusiastic and professional
- ALWAYS greet first when the customer says hello
- Ask open-ended questions like "What did you love most?" or "Was there anything that could be improved?"
- Show empathy and appreciation for their feedback
- Keep responses concise (2-3 sentences max per turn)
- Don't sound robotic or scripted
- After 2-3 meaningful exchanges, wrap up naturally and call the end_review function
- Make the customer feel heard and valued`
        }]
      },
      tools: [{
        functionDeclarations: [endReviewDeclaration]
      }]
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    if (!connected) return;

    const handleSetupComplete = async () => {
      console.log("✅ Setup complete - WebSocket is ready");
      
      // Now it's safe to send the initial message
      setTimeout(() => {
        console.log("👋 Sending initial greeting...");
        client.send([{
          text: "Hello, I just completed my purchase and I'm ready to share my feedback about the product."
        }], true);
        
        // Start recording after AI has time to respond
        setTimeout(async () => {
          console.log("🎤 Starting audio recording...");
          setIsRecording(true);
          setIsConnecting(false);
          
          audioRecorderRef.current = new AudioRecorder(16000);
          
          audioRecorderRef.current.on("data", (base64Audio: string) => {
            if (connected && isRecording) {
              client.sendRealtimeInput([
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio,
                },
              ]);
            }
          });

          await audioRecorderRef.current.start();
          console.log("✅ Recording started");
        }, 2000);
      }, 500);
    };

    const handleContent = (data: any) => {
      const text = data.text || data.transcript;
      if (text) {
        currentTranscriptRef.current += text;
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === "assistant") {
            return [
              ...prev.slice(0, -1),
              { role: "assistant", content: currentTranscriptRef.current }
            ];
          }
          return [...prev, { role: "assistant", content: currentTranscriptRef.current }];
        });
      }
    };

    const handleTurnComplete = () => {
      currentTranscriptRef.current = "";
      setIsProcessing(false);
    };

    const handleToolCall = async (toolCall: any) => {
      console.log("Tool call received:", toolCall);
      if (toolCall.functionCalls) {
        for (const fc of toolCall.functionCalls) {
          if (fc.name === "end_review") {
            const args = fc.args;

            try {
              // Get current user
              const { data: { user } } = await supabase.auth.getUser();
              
              if (!user) {
                throw new Error("User not authenticated");
              }

              const reviewDataToSave = {
                product_name: args.product_name || "Rouge Velvet Matte Lipstick",
                customer_name: args.customer_name || null,
                customer_emotion: args.customer_emotion || "satisfied",
                recommendation_score: args.recommendation_score || 3,
                review_summary: args.review_summary || "",
                key_positive_points: args.key_positive_points || [],
                key_negative_points: args.key_negative_points || [],
                improvement_suggestions: args.improvement_suggestions || [],
                user_id: user.id,
              };

              // Validate with zod schema
              const { reviewSchema } = await import("@/lib/validation");
              const validatedData = reviewSchema.parse(reviewDataToSave);

              const { error } = await supabase
                .from("reviews")
                .insert(validatedData);

              if (error) {
                console.error("Error saving review:", error);
                toast({
                  title: "Error saving review",
                  description: "Your review couldn't be saved. Please try again.",
                  variant: "destructive",
                });
              } else {
                console.log("Review saved successfully");
                toast({
                  title: "Review saved!",
                  description: "Your feedback has been recorded.",
                });
              }

              setReviewData(reviewDataToSave);
            } catch (error: any) {
              console.error("Error saving review:", error);
              
              const errorMessage = error.name === "ZodError" 
                ? "The review data didn't meet our requirements. Please try again with valid information."
                : error.message || "Failed to save review";
              
              toast({
                title: "Validation Error",
                description: errorMessage,
                variant: "destructive",
              });
            }
          }
        }
      }
    };

    client.on("setupcomplete", handleSetupComplete);
    client.on("content", handleContent);
    client.on("turncomplete", handleTurnComplete);
    client.on("toolcall", handleToolCall);

    return () => {
      client.off("setupcomplete", handleSetupComplete);
      client.off("content", handleContent);
      client.off("turncomplete", handleTurnComplete);
      client.off("toolcall", handleToolCall);
    };
  }, [client, connected]);

  const handleStartRecording = async () => {
    // Prevent multiple clicks during connection
    if (isConnecting || isRecording) {
      console.log("⚠️ Already connecting or recording, ignoring click");
      return;
    }

    try {
      console.log("🎬 Starting voice review session...");
      setIsConnecting(true);
      setSessionStarted(true);
      setMessages([]);

      // Connect to Gemini Live API
      // The setupcomplete event handler will take care of sending messages and starting recording
      if (!connected) {
        console.log("📡 Connecting to Gemini Live API...");
        await connect();
        console.log("⏳ Waiting for WebSocket setup to complete...");
      }

      toast({
        title: "Connected Successfully",
        description: "The AI will greet you shortly. Please speak after you hear the greeting.",
      });

    } catch (error) {
      console.error("❌ Error starting recording:", error);
      setIsRecording(false);
      setIsConnecting(false);
      setSessionStarted(false);
      toast({
        title: "Connection Failed",
        description: "Unable to start voice review. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    console.log("🛑 Stopping recording...");
    setIsRecording(false);
    setIsProcessing(true);

    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
  };

  if (reviewData) {
    return <ReviewSummary 
      data={reviewData} 
      onNewReview={() => {
        setReviewData(null);
        setMessages([]);
        setSessionStarted(false);
      }} 
      onBack={() => navigate("/dashboard")} 
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="p-8 md:p-12 shadow-card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">VOIX Voice Review</h2>
            <p className="text-muted-foreground">
              {!sessionStarted 
                ? "Press the call button to start voice review"
                : isConnecting
                  ? "🎧 Connecting... Please wait"
                  : !isRecording
                    ? "🎧 AI is greeting you... Please wait"
                    : "🎤 Connected - Speak freely"}
            </p>
            {sessionStarted && isRecording && (
              <p className="text-sm text-muted-foreground mt-2">
                💬 AI is asking questions and listening to your feedback
              </p>
            )}
            {sessionStarted && (isConnecting || !isRecording) && (
              <p className="text-sm text-primary mt-2 font-medium animate-pulse">
                ⏳ Waiting for AI greeting...
              </p>
            )}
          </div>

          {/* Voice Waveform */}
          <div className="mb-8">
            <VoiceWaveform isActive={isRecording} />
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center mb-8">
            {!sessionStarted ? (
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="w-24 h-24 rounded-full gradient-primary shadow-glow"
              >
                <Phone className="h-10 w-10 text-primary-foreground" />
              </Button>
            ) : (isProcessing || isConnecting) ? (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={handleStopRecording}
                disabled={!isRecording}
                className={`w-24 h-24 rounded-full shadow-glow ${
                  isRecording
                    ? "bg-accent hover:bg-accent/90"
                    : "gradient-primary opacity-50 cursor-not-allowed"
                }`}
              >
                {isRecording ? (
                  <PhoneOff className="h-10 w-10 text-accent-foreground" />
                ) : (
                  <Phone className="h-10 w-10 text-primary-foreground" />
                )}
              </Button>
            )}
          </div>

          {/* Transcription Display */}
          {sessionStarted && (
            <TranscriptionDisplay messages={messages} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default VoiceReview;
