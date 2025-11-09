import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Loader2 } from "lucide-react";
import VoiceWaveform from "./VoiceWaveform";
import TranscriptionDisplay from "./TranscriptionDisplay";
import ReviewSummary from "./ReviewSummary";
import { useNavigate } from "react-router-dom";

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

const VoiceReview = ({ onBack }: VoiceReviewProps) => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    setSessionStarted(true);
    // Add initial greeting with more context
    setMessages([
      {
        role: "assistant",
        content: "Hi! Thanks for taking the time to share your feedback. I'm here to learn about your experience with the product. Let's start - what product did you purchase and what did you think of it?",
      },
    ]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate AI conversation - add user response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "user",
        content: "I bought the Premium Wireless Headphones. The sound quality is excellent and they're really comfortable!",
      }]);
    }, 1000);

    // Simulate AI follow-up
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "That's great to hear! Could you tell me more about the comfort and if there was anything you didn't like?",
      }]);
      setIsProcessing(false);
    }, 2500);
    
    // Simulate processing and generating review data after conversation
    setTimeout(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setReviewData({
          product_name: "Premium Wireless Headphones",
          customer_emotion: "satisfied",
          key_positive_points: [
            "Excellent sound quality",
            "Very comfortable for long use",
            "Fast delivery",
            "High quality packaging",
          ],
          key_negative_points: [
            "Size was smaller than expected",
            "Instructions could be clearer",
          ],
          improvement_suggestions: [
            "Include detailed size chart",
            "Add quick start guide with visuals",
            "Provide video tutorials online",
          ],
          review_summary: "Customer is very satisfied with the product quality and comfort. Main feedback focuses on improving documentation and size expectations.",
          recommendation_score: 4,
        });
      }, 2000);
    }, 5000);
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
            <h2 className="text-3xl font-bold mb-2">AI Voice Review Assistant</h2>
            <p className="text-muted-foreground">
              {!sessionStarted 
                ? "Click the microphone to start sharing your thoughts"
                : isRecording 
                  ? "I'm listening... Speak naturally about your experience" 
                  : "Processing your feedback..."}
            </p>
            {sessionStarted && (
              <p className="text-sm text-muted-foreground mt-2">
                💡 Tip: Speak naturally - the AI will ask follow-up questions
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
                <Mic className="h-10 w-10 text-primary-foreground" />
              </Button>
            ) : isProcessing ? (
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-24 h-24 rounded-full shadow-glow ${
                  isRecording
                    ? "bg-accent hover:bg-accent/90"
                    : "gradient-primary"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-10 w-10 text-accent-foreground" />
                ) : (
                  <Mic className="h-10 w-10 text-primary-foreground" />
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
