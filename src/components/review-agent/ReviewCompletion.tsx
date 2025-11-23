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
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Success Header with Gradient */}
      <Card className="relative overflow-hidden p-10 text-center border-none shadow-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-50" />
        <div className="relative z-10">
          <div className="flex justify-center mb-6 animate-in scale-in duration-500 delay-100">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <CheckCircle className="w-14 h-14 text-white animate-in scale-in duration-300 delay-200" />
            </div>
          </div>
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent animate-in fade-in duration-500 delay-200">
            Thank You for Answering!
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto animate-in fade-in duration-500 delay-300">
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving your valuable feedback...
              </span>
            ) : (
              "Your honest feedback helps us create better beauty products for you."
            )}
          </p>
        </div>
      </Card>

      {/* Review Summary with Modern Design */}
      <Card className="p-8 shadow-elegant border-primary/10 hover:shadow-glow transition-all duration-300 animate-in slide-in-right duration-500 delay-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-2xl font-bold">Your Review Summary</h3>
        </div>
        
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground mb-2 font-medium">Product</p>
            <p className="text-lg font-semibold text-foreground">
              {reviewData.productName || "Rouge Velvet Matte Lipstick - Cherry Red #05"}
            </p>
          </div>
          
          {reviewData.overallRating && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
              <p className="text-sm text-muted-foreground mb-3 font-medium">Your Rating</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-7 h-7 transition-all duration-300 delay-${i * 50} ${
                      i < reviewData.overallRating!
                        ? "text-accent fill-accent animate-in scale-in"
                        : "text-muted/30"
                    }`}
                  />
                ))}
                <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {reviewData.overallRating}/5
                </span>
              </div>
            </div>
          )}

          {Array.isArray(reviewData.positivePoints) && reviewData.positivePoints.length > 0 && (
            <div className="p-4 rounded-lg bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/50">
              <p className="text-sm font-medium mb-3 text-green-900 dark:text-green-100">What You Loved</p>
              <div className="flex flex-wrap gap-2">
                {reviewData.positivePoints.map((point, i) => (
                  <Badge 
                    key={i} 
                    className="px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-300 dark:border-green-800 hover-scale animate-in scale-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Beauty Insights with Enhanced Design */}
      <Card className="p-8 shadow-elegant border-accent/10 hover:shadow-glow transition-all duration-300 animate-in slide-in-right duration-500 delay-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            Beauty Insights Just for You
          </h3>
        </div>
        
        <div className="grid gap-4">
          {beautyInsights.map((insight, i) => (
            <div 
              key={i} 
              className="group p-5 rounded-xl border-l-4 border-primary/40 bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 hover:to-accent/5 transition-all duration-300 hover-scale animate-in fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <h4 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                {insight.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {insight.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA Button */}
      <div className="flex justify-center animate-in fade-in duration-500 delay-500">
        <Button 
          size="lg"
          onClick={() => navigate("/dashboard")}
          className="group px-8 py-6 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-glow hover:shadow-elegant transition-all duration-300"
        >
          Back to Dashboard
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
};
