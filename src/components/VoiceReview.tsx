import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Mic, MicOff, Loader2 } from "lucide-react";
import VoiceWaveform from "./VoiceWaveform";
import TranscriptionDisplay from "./TranscriptionDisplay";
import ReviewSummary from "./ReviewSummary";

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
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
    setSessionStarted(true);
    // Add initial greeting
    setMessages([
      {
        role: "assistant",
        content: "Hi! Thanks for taking the time to share your feedback. I'd love to hear about your recent experience. What did you think of the product?",
      },
    ]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing and generating review data
    setTimeout(() => {
      setIsProcessing(false);
      setReviewData({
        product_name: "Sample Product",
        customer_emotion: "satisfied",
        key_positive_points: [
          "Fast delivery",
          "High quality packaging",
          "Product met expectations",
        ],
        key_negative_points: [
          "Instructions could be clearer",
        ],
        improvement_suggestions: [
          "Include quick start guide",
          "Add video tutorials",
        ],
        review_summary: "Customer is generally satisfied with the product quality and delivery speed. Main area for improvement is documentation.",
        recommendation_score: 4,
      });
    }, 2000);
  };

  if (reviewData) {
    return <ReviewSummary data={reviewData} onNewReview={() => setReviewData(null)} onBack={onBack} />;
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
            <h2 className="text-3xl font-bold mb-2">Voice Review Session</h2>
            <p className="text-muted-foreground">
              {!sessionStarted 
                ? "Click the microphone to start your review"
                : isRecording 
                  ? "Listening to your feedback..." 
                  : "Processing your response..."}
            </p>
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
