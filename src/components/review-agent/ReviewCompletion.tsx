import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, TrendingUp, Package, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReviewCompletionProps {
  reviewData: {
    productName?: string;
    overallRating?: number;
    positivePoints?: string[];
    negativePoints?: string[];
    sentiment?: "positive" | "neutral" | "negative";
  };
  isSaving?: boolean;
  savedReviewId?: string | null;
}

export const ReviewCompletion = ({ reviewData, isSaving = false, savedReviewId = null }: ReviewCompletionProps) => {
  const navigate = useNavigate();

  console.log("🎨 ReviewCompletion rendering with data:", reviewData);

  const beautyInsights = [
    {
      title: "Recommended Products for Your Skin Type",
      description: "For dry skin: Try our Hydrating Face Cream and Nourishing Body Lotion. For oily skin: Our Refreshing Facial Toner helps balance oil production. For combination skin: Use our lightweight moisturizers that hydrate without clogging pores."
    },
    {
      title: "Daily Skincare Routine",
      description: "Morning: Cleanse → Tone → Serum → Moisturize → SPF. Evening: Double cleanse → Tone → Treatment/Serum → Eye cream → Night cream. Remember to be gentle and consistent for best results."
    },
    {
      title: "Skin Management Tips",
      description: "Stay hydrated by drinking 8 glasses of water daily. Get 7-8 hours of sleep for skin regeneration. Avoid touching your face throughout the day. Change pillowcases weekly to prevent breakouts."
    },
    {
      title: "Product Pairing Recommendations",
      description: reviewData.sentiment === "positive" 
        ? "Based on your satisfaction, pair this with our vitamin C serum for brightening and our night repair cream for enhanced results while you sleep."
        : "We recommend complementing your routine with our gentle cleansing foam and hydrating essence to address your concerns effectively."
    },
    {
      title: "Seasonal Skincare Adjustments",
      description: "Winter: Use richer moisturizers and add facial oils. Summer: Switch to lighter textures and boost SPF protection. Spring/Fall: Focus on repair and prevention with antioxidant serums."
    },
    {
      title: "Ingredient Insights",
      description: "Hyaluronic Acid: Intense hydration. Niacinamide: Minimizes pores and evens skin tone. Retinol: Anti-aging and cell renewal. Vitamin C: Brightening and antioxidant protection. Ceramides: Strengthen skin barrier."
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Success Header */}
      <Card className="p-8 text-center shadow-glow border-2 border-primary/20">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">Thank You for Answering!</h2>
        <p className="text-muted-foreground text-lg">
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving your valuable feedback...
            </span>
          ) : savedReviewId ? (
            "Your honest feedback helps us create better beauty products for you."
          ) : (
            "Your honest feedback helps us create better beauty products for you."
          )}
        </p>
      </Card>

      {/* Review Summary */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Your Review Summary
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Product</p>
            <p className="font-semibold">{reviewData.productName || "Rouge Velvet Matte Lipstick - Cherry Red #05"}</p>
          </div>
          
          {reviewData.overallRating && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Rating</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < reviewData.overallRating!
                        ? "text-accent fill-accent"
                        : "text-muted"
                    }`}
                  />
                ))}
                <span className="ml-2 font-semibold">{reviewData.overallRating}/5</span>
              </div>
            </div>
          )}

          {Array.isArray(reviewData.positivePoints) && reviewData.positivePoints.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">What You Loved</p>
              <div className="flex flex-wrap gap-2">
                {reviewData.positivePoints.map((point, i) => (
                  <Badge key={i} className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Beauty Insights for Customer */}
      <Card className="p-6 shadow-card">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Beauty Insights Just for You
        </h3>
        <div className="space-y-4">
          {beautyInsights.map((insight, i) => (
            <div key={i} className="border-l-4 border-primary/30 pl-4">
              <h4 className="font-semibold mb-1">{insight.title}</h4>
              <p className="text-sm text-muted-foreground">{insight.description}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
