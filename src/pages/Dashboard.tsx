import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, TrendingUp, MessageSquare, Smile, Meh, Frown, Star, Mic, Package, DollarSign, Users, ShoppingCart, Search, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mockProducts, MockProduct } from "@/lib/mockProducts";

// Extended mock data - 10 Beauty products reviews
const initialMockReviews = [
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
  {
    id: "4",
    customerName: "Jessica Kim",
    productName: "Volumizing Mascara",
    emotion: "happy",
    recommendationScore: 5,
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    summary: "Best mascara I've ever used! Creates dramatic volume without clumping.",
    keyPositive: ["Dramatic volume", "No clumping", "Long-lasting", "Easy to remove"],
    keyNegative: [],
  },
  {
    id: "5",
    customerName: "David Park",
    productName: "Gentle Face Cleanser",
    emotion: "satisfied",
    recommendationScore: 4,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    summary: "Great cleanser for sensitive skin. Would like a larger size option.",
    keyPositive: ["Gentle formula", "No irritation", "Pleasant scent"],
    keyNegative: ["Small bottle size"],
  },
  {
    id: "6",
    customerName: "Amanda Lewis",
    productName: "Anti-Aging Night Cream",
    emotion: "happy",
    recommendationScore: 5,
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    summary: "Noticed visible improvement in fine lines after 2 weeks. Highly recommend!",
    keyPositive: ["Visible results", "Luxurious texture", "Non-greasy", "Pleasant smell"],
    keyNegative: [],
  },
  {
    id: "7",
    customerName: "Robert Taylor",
    productName: "BB Cream SPF 30",
    emotion: "satisfied",
    recommendationScore: 4,
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    summary: "Good coverage and sun protection. Limited shade range.",
    keyPositive: ["Natural coverage", "SPF protection", "Lightweight"],
    keyNegative: ["Limited shade options"],
  },
  {
    id: "8",
    customerName: "Lisa Anderson",
    productName: "Liquid Eyeliner Pen",
    emotion: "neutral",
    recommendationScore: 3,
    timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    summary: "Precise application but dries out quickly. Good for the price.",
    keyPositive: ["Precise tip", "Affordable price"],
    keyNegative: ["Dries out fast", "Not very pigmented"],
  },
  {
    id: "9",
    customerName: "Kevin Martinez",
    productName: "Moisturizing Lip Balm",
    emotion: "happy",
    recommendationScore: 5,
    timestamp: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    summary: "Perfect for daily use! Keeps lips soft and moisturized all day.",
    keyPositive: ["Long-lasting moisture", "Pleasant taste", "Compact size", "Not sticky"],
    keyNegative: [],
  },
  {
    id: "10",
    customerName: "Rachel White",
    productName: "Setting Powder",
    emotion: "satisfied",
    recommendationScore: 4,
    timestamp: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
    summary: "Controls oil well and doesn't look cakey. Good value for money.",
    keyPositive: ["Oil control", "Natural finish", "Good value"],
    keyNegative: ["Limited shade range"],
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchExplanation, setSearchExplanation] = useState("");
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [highlightReviewId, setHighlightReviewId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const exampleQueries = [
    "Show unhappy customers",
    "Reviews from this week with low scores",
    "5-star reviews",
    "What products have drying issues?",
  ];

  // Check for highlight review ID from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlightReview');
    if (highlightId) {
      setHighlightReviewId(highlightId);
      // Remove query parameter after reading
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('highlightReview');
      navigate(`/dashboard${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`, { replace: true });
    }
  }, [searchParams, navigate]);

  // Scroll to highlighted review when reviews are loaded
  useEffect(() => {
    if (highlightReviewId && reviews.length > 0 && !isLoading) {
      setTimeout(() => {
        const element = document.getElementById(`review-${highlightReviewId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight animation
          element.classList.add('animate-pulse', 'ring-4', 'ring-primary', 'rounded-lg');
          setTimeout(() => {
            element.classList.remove('animate-pulse', 'ring-4', 'ring-primary');
          }, 3000);
        }
      }, 500);
    }
  }, [highlightReviewId, reviews, isLoading]);

  // Fetch reviews from database
  useEffect(() => {
    fetchReviews();
    loadProducts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        () => {
          console.log('Reviews updated, refetching...');
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadProducts = () => {
    setIsLoadingProducts(true);
    // Use mock products instead of Shopify API
    setProducts(mockProducts);
    setIsLoadingProducts(false);
  };

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match UI format
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
      })) || [];

      setReviews(transformedReviews.length > 0 ? transformedReviews : initialMockReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error loading reviews",
        description: "Using sample data instead.",
        variant: "destructive",
      });
      setReviews(initialMockReviews);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchReviews();
      setSearchExplanation("");
      return;
    }

    try {
      setIsSearching(true);
      const { data, error } = await supabase.functions.invoke('search-reviews', {
        body: { query: searchQuery }
      });

      if (error) {
        console.error('Search error:', error);
        toast({
          title: "Search failed",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data.error) {
        toast({
          title: "Search failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Transform results to match UI format
      const transformedResults = data.results?.map((review: any) => ({
        id: review.id,
        customerName: review.customer_name || "Anonymous",
        productName: review.product_name,
        emotion: review.customer_emotion,
        recommendationScore: review.recommendation_score,
        timestamp: review.created_at,
        summary: review.review_summary,
        keyPositive: review.key_positive_points || [],
        keyNegative: review.key_negative_points || [],
      })) || [];

      setReviews(transformedResults);
      setSearchExplanation(data.explanation || "");
      
      toast({
        title: "Search complete",
        description: `Found ${data.count} review(s)`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
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

  const averageScore = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.recommendationScore, 0) / reviews.length).toFixed(1)
    : "0.0";

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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold">VOIX Dashboard</h1>
              <p className="text-muted-foreground">Real-time insights from customer feedback</p>
            </div>
          </div>
        </div>

        {/* Natural Language Search */}
        <Card className="p-6 shadow-card">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">🔍 Search Reviews with Natural Language</h2>
              <p className="text-muted-foreground text-sm">
                Ask questions in plain English and AI will understand what you're looking for
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder='Example: "Show frustrated customers" or "5-star reviews this week"'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
              {searchQuery && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchExplanation("");
                    fetchReviews();
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            
            {/* Example queries as chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Try these:</span>
              {exampleQueries.map((query, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(query);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="text-xs h-7"
                >
                  {query}
                </Button>
              ))}
            </div>

            {/* AI explanation */}
            {searchExplanation && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold text-primary">AI Understanding:</span>{" "}
                  <span className="text-foreground">{searchExplanation}</span>
                </p>
              </div>
            )}
          </div>
        </Card>

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
                <p className="text-3xl font-bold">
                  {reviews.length > 0 
                    ? Math.round((reviews.filter(r => r.emotion === "happy" || r.emotion === "satisfied").length / reviews.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Section */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Products</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => navigate("/generate-images")}
              >
                <Package className="w-4 h-4 mr-2" />
                Generate Images
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate("/shop")}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Shop
              </Button>
            </div>
          </div>
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p>No products found in your store.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const image = product.node.images?.edges?.[0]?.node;
                const price = parseFloat(product.node.priceRange.minVariantPrice.amount);
                
                return (
                  <Card 
                    key={product.node.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/insights/${product.node.handle}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-secondary/20">
                      {image ? (
                        <img
                          src={image.url}
                          alt={product.node.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1 mb-2">{product.node.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {product.node.description || 'No description'}
                      </p>
                      <p className="text-lg font-bold">
                        {product.node.priceRange.minVariantPrice.currencyCode} ${price.toFixed(2)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Voice Reviews */}
        <Card className="p-6 shadow-card">
          <h2 className="text-2xl font-bold mb-6">Recent Reviews</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No reviews found. Start collecting feedback!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
              <div
                key={review.id}
                id={`review-${review.id}`}
                className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  highlightReviewId === review.id 
                    ? 'bg-primary/10 border-primary border-2 shadow-lg' 
                    : ''
                }`}
                onClick={() => setSelectedReview(selectedReview === review.id ? null : review.id)}
                ref={highlightReviewId === review.id ? highlightRef : null}
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
                          {review.keyPositive.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.keyNegative.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Areas for Improvement</h4>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {review.keyNegative.map((point: string, i: number) => (
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

        {/* Sales & Marketing Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 shadow-card">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Sales Insights
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Average Order Value</p>
                  <p className="text-2xl font-bold">$42.50</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Repurchase Rate</p>
                  <p className="text-2xl font-bold">68%</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Top Converting Products</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Hydrating Face Serum</span>
                    <Badge className="bg-green-100 text-green-800">92%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Volumizing Mascara</span>
                    <Badge className="bg-green-100 text-green-800">88%</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Moisturizing Lip Balm</span>
                    <Badge className="bg-green-100 text-green-800">85%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              Marketing Insights
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
                  <p className="text-2xl font-bold">4.2/5.0</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Review Completion</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
                <Mic className="w-8 h-8 text-accent" />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Key Action Items</p>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border-l-4 border-blue-500">
                    <p className="text-sm font-medium">Address drying concerns in lipstick formula</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded border-l-4 border-purple-500">
                    <p className="text-sm font-medium">Expand shade range for BB cream & powder</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded border-l-4 border-green-500">
                    <p className="text-sm font-medium">Highlight long-lasting benefits in marketing</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

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
          <h2 className="text-2xl font-bold mb-6">VOIX Review Flow</h2>
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
