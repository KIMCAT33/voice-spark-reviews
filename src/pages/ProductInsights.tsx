import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Smile, Meh, Frown, TrendingUp, MessageSquare, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";

const ProductInsights = () => {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);

  useEffect(() => {
    loadProductAndReviews();
  }, [handle]);

  const loadProductAndReviews = async () => {
    try {
      setIsLoading(true);
      
      // Fetch product from Shopify
      const products = await fetchProducts(100);
      const foundProduct = products.find(p => p.node.handle === handle);
      
      if (!foundProduct) {
        toast({
          title: "Product not found",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }
      
      setProduct(foundProduct);

      // Fetch reviews for this product
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_name', foundProduct.node.title)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedReviews = data?.map(review => ({
        id: review.id,
        customerName: review.customer_name || "Anonymous",
        productName: review.product_name,
        emotion: review.customer_emotion,
        recommendationScore: review.recommendation_score,
        timestamp: review.created_at,
        summary: review.review_summary,
        keyPositive: review.key_positive_points || [],
        keyNegative: review.key_negative_points || [],
        improvementSuggestions: review.improvement_suggestions || [],
      })) || [];

      setReviews(transformedReviews);
    } catch (error) {
      console.error('Error loading product insights:', error);
      toast({
        title: "Error loading insights",
        description: "Failed to load product reviews.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const averageScore = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.recommendationScore, 0) / reviews.length).toFixed(1)
    : "0.0";

  const positiveSentiment = reviews.length > 0 
    ? Math.round((reviews.filter(r => r.emotion === "happy" || r.emotion === "satisfied").length / reviews.length) * 100)
    : 0;

  const allPositivePoints = reviews.flatMap(r => r.keyPositive);
  const allNegativePoints = reviews.flatMap(r => r.keyNegative);
  const allSuggestions = reviews.flatMap(r => r.improvementSuggestions);

  // Count frequency of positive points
  const positiveFrequency: Record<string, number> = {};
  allPositivePoints.forEach(point => {
    positiveFrequency[point] = (positiveFrequency[point] || 0) + 1;
  });
  const topPositive = Object.entries(positiveFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([point]) => point);

  // Count frequency of negative points
  const negativeFrequency: Record<string, number> = {};
  allNegativePoints.forEach(point => {
    negativeFrequency[point] = (negativeFrequency[point] || 0) + 1;
  });
  const topNegative = Object.entries(negativeFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([point]) => point);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const image = product.node.images?.edges?.[0]?.node;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Product Overview */}
        <Card className="p-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 aspect-square overflow-hidden rounded-lg bg-secondary/20 flex-shrink-0">
              {image ? (
                <img
                  src={image.url}
                  alt={product.node.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{product.node.title}</h1>
              <p className="text-muted-foreground mb-4">{product.node.description}</p>
              <div className="flex items-center gap-4">
                <p className="text-2xl font-bold">
                  {product.node.priceRange.minVariantPrice.currencyCode} $
                  {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/product/${product.node.handle}`)}
                >
                  View in Shop
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Analytics Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
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
                <p className="text-3xl font-bold">{reviews.length}</p>
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
                <p className="text-3xl font-bold">{positiveSentiment}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Key Insights */}
        {reviews.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Positive Points */}
            {topPositive.length > 0 && (
              <Card className="p-6 shadow-card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Smile className="w-5 h-5 text-green-500" />
                  Top Positive Feedback
                </h3>
                <ul className="space-y-2">
                  {topPositive.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Top Negative Points */}
            {topNegative.length > 0 && (
              <Card className="p-6 shadow-card">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Frown className="w-5 h-5 text-red-500" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {topNegative.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">!</span>
                      <span className="text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* Reviews List */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <p>No reviews yet for this product.</p>
              <p className="text-sm mt-2">Reviews will appear here after customers complete voice interviews.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
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
                            {review.keyPositive.map((point: string, i: number) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.keyNegative.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1">Negative Points</h4>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {review.keyNegative.map((point: string, i: number) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {review.improvementSuggestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-1">Improvement Suggestions</h4>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {review.improvementSuggestions.map((point: string, i: number) => (
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
          )}
        </Card>
      </div>
    </div>
  );
};

export default ProductInsights;
