import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Star } from "lucide-react";

interface ReviewData {
  product_name: string;
  customer_emotion: string;
  key_positive_points: string[];
  key_negative_points: string[];
  improvement_suggestions: string[];
  review_summary: string;
  recommendation_score: number;
}

interface ReviewSummaryProps {
  data: ReviewData;
  onNewReview: () => void;
  onBack: () => void;
}

const ReviewSummary = ({ data, onNewReview, onBack }: ReviewSummaryProps) => {
  const handleDownloadJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "review-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <Button variant="ghost" onClick={onBack} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>

        <Card className="p-8 md:p-12 shadow-card space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Review Summary</h2>
            <p className="text-muted-foreground">Thank you for sharing your thoughts! Here's what we learned:</p>
          </div>

          {/* Rating */}
          <div className="flex justify-center items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-8 w-8 ${i < data.recommendation_score ? "text-accent fill-accent" : "text-muted"}`}
              />
            ))}
          </div>

          {/* Emotion Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Customer Emotion: {data.customer_emotion}
            </Badge>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Summary</h3>
            <p className="text-muted-foreground">{data.review_summary}</p>
          </div>

          {/* Positive Points */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">What Worked Well</h3>
            <ul className="space-y-2">
              {data.key_positive_points.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Areas for Improvement */}
          {data.key_negative_points.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">Areas for Improvement</h3>
              <ul className="space-y-2">
                {data.key_negative_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Improvement Suggestions</h3>
            <ul className="space-y-2">
              {data.improvement_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" variant="outline" onClick={handleDownloadJSON}>
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
            <Button size="lg" className="gradient-primary" onClick={onNewReview}>
              Start New Review
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReviewSummary;
