import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Phone, PhoneOff, Loader2 } from "lucide-react";
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
    // Add initial greeting - CS team style
    setMessages([
      {
        role: "assistant",
        content: "Hello! Thank you for taking the time to speak with us today. We'd love to hear about your experience with the product you purchased. Let's start - which product did you receive and what are your initial thoughts?",
      },
    ]);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate customer response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "user",
        content: "I bought the Rouge Velvet Matte Lipstick in Cherry Red. The color is absolutely gorgeous and it stays on all day!",
      }]);
    }, 1000);

    // Simulate CS follow-up
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "That's wonderful to hear! I'm glad you love the color. Could you tell me more about the texture and if there's anything you think we could improve?",
      }]);
      setIsProcessing(false);
    }, 2500);
    
    // Simulate processing and generating review data after conversation
    setTimeout(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setReviewData({
          product_name: "Rouge Velvet Matte Lipstick",
          customer_emotion: "satisfied",
          key_positive_points: [
            "Beautiful cherry red color",
            "Long-lasting formula",
            "Smooth matte finish",
            "Comfortable to wear",
          ],
          key_negative_points: [
            "Slightly drying after 6+ hours",
            "Packaging could be more luxurious",
          ],
          improvement_suggestions: [
            "Add hydrating ingredients",
            "Upgrade packaging design",
            "Include color chart for online shopping",
          ],
          review_summary: "Customer is very satisfied with the color and longevity of the lipstick. Minor feedback on hydration and packaging design.",
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
            <h2 className="text-3xl font-bold mb-2">Customer Service Review Call</h2>
            <p className="text-muted-foreground">
              {!sessionStarted 
                ? "Press the call button to connect with our team"
                : isRecording 
                  ? "Connected - Share your thoughts naturally" 
                  : "Processing your feedback..."}
            </p>
            {sessionStarted && (
              <p className="text-sm text-muted-foreground mt-2">
                💬 Speak naturally - our team will guide the conversation
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
