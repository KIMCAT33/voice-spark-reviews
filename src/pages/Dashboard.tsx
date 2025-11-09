import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, MessageSquare, Smile, Meh, Frown, Star, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data - Beauty products
const mockReviews = [
  {
    id: "1",
    customerName: "Sarah Johnson",
    productName: "Rouge Velvet Matte Lipstick",
    emotion: "satisfied",
    recommendationScore: 4,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    summary: "Beautiful cherry red color with long-lasting formula. Slightly drying after extended wear.",
    keyPositive: ["Gorgeous color", "Long-lasting", "Smooth matte finish", "Comfortable"],
    keyNegative: ["Slightly drying after 6+ hours"],
  },
  {
    id: "2",
    customerName: "Michael Chen",
    productName: "Hydrating Face Serum",
    emotion: "happy",
    recommendationScore: 5,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    summary: "Absolutely love it! Skin feels hydrated all day and the glow is amazing.",
    keyPositive: ["Deeply hydrating", "Natural glow", "Pleasant scent", "Fast absorption"],
    keyNegative: [],
  },
  {
    id: "3",
    customerName: "Emily Rodriguez",
    productName: "Eyeshadow Palette Nude",
    emotion: "neutral",
    recommendationScore: 3,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    summary: "Good quality eyeshadows but color payoff could be better. Some shades are hard to blend.",
    keyPositive: ["Nice color selection", "Compact packaging"],
    keyNegative: ["Color payoff not strong enough", "Some shades difficult to blend"],
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case "happy":
        return <Smile className="w-5 h-5 text-green-500" />;
      case "neutral":
        return <Meh className="w-5 h-5 text-yellow-500" />;
      case "frustrated":
        return <Frown className="w-5 h-5 text-red-500" />;
      default:
        return <Smile className="w-5 h-5 text-blue-500" />;
    }
  };

  const getEmotionBadge = (emotion: string) => {
    const colors = {
      happy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      satisfied: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      neutral: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      frustrated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[emotion as keyof typeof colors] || colors.satisfied;
  };

  const averageScore = (mockReviews.reduce((acc, r) => acc + r.recommendationScore, 0) / mockReviews.length).toFixed(1);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold mt-4">Voice Review Dashboard</h1>
            <p className="text-muted-foreground">Real-time insights from customer feedback</p>
          </div>
        </div>

        {/* Insights Summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-3xl font-bold">{averageScore}/5</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10">
                <MessageSquare className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold">{mockReviews.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Positive Sentiment</p>
                <p className="text-3xl font-bold">
                  {Math.round((mockReviews.filter(r => r.emotion === "happy" || r.emotion === "satisfied").length / mockReviews.length) * 100)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Voice Reviews */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Recent Voice Reviews</h2>
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedReview(selectedReview === review.id ? null : review.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getEmotionIcon(review.emotion)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{review.customerName}</h3>
                        <Badge className={getEmotionBadge(review.emotion)}>
                          {review.emotion}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(review.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.productName}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.recommendationScore
                                ? "text-accent fill-accent"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedReview === review.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <h4 className="font-semibold mb-1">Summary</h4>
                      <p className="text-sm text-muted-foreground">{review.summary}</p>
                    </div>
                    {review.keyPositive.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Positive Points</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {review.keyPositive.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.keyNegative.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Areas for Improvement</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {review.keyNegative.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Common Keywords */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Top Keywords</h2>
          <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3 text-green-600 dark:text-green-400">Positive</h3>
                <div className="flex flex-wrap gap-2">
                  {["Color", "Long-lasting", "Hydrating", "Smooth finish", "Natural glow"].map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-red-600 dark:text-red-400">Negative</h3>
                <div className="flex flex-wrap gap-2">
                  {["Drying", "Color payoff", "Blending difficulty"].map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
          </div>
        </Card>

        {/* Real-time Flow Visualization */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Voice Review Flow</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold">Voice Input</p>
              <p className="text-xs text-muted-foreground">Customer speaks</p>
            </div>
            <div className="text-2xl text-muted-foreground rotate-90 md:rotate-0">→</div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-accent" />
              </div>
              <p className="font-semibold">AI Processing</p>
              <p className="text-xs text-muted-foreground">Gemini analyzes</p>
            </div>
            <div className="text-2xl text-muted-foreground rotate-90 md:rotate-0">→</div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <p className="font-semibold">Structured Data</p>
              <p className="text-xs text-muted-foreground">JSON output</p>
            </div>
            <div className="text-2xl text-muted-foreground rotate-90 md:rotate-0">→</div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold">Dashboard</p>
              <p className="text-xs text-muted-foreground">Live insights</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
