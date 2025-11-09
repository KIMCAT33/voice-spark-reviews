import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import lipstickImage from "@/assets/red-lipstick.jpg";

const ProductPurchase = () => {
  const navigate = useNavigate();

  // Mock product data - Beauty product
  const mockPurchase = {
    customerName: "Sarah Johnson",
    email: "sarah.j@example.com",
    productId: "PRD-2024-001",
    productName: "Rouge Velvet Matte Lipstick",
    productColor: "Cherry Red #05",
    orderNumber: "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 shadow-card space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Thank You for Your Purchase!</h1>
          <p className="text-muted-foreground">
            Your order has been confirmed and will be shipped soon.
          </p>
        </div>

        {/* Product Image & Details */}
        <div className="space-y-4 bg-muted/50 rounded-lg p-6">
          <div className="flex items-start gap-6">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0">
              <img 
                src={lipstickImage} 
                alt={mockPurchase.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-xl">{mockPurchase.productName}</h3>
                <p className="text-sm text-muted-foreground">{mockPurchase.productColor}</p>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Order Number: {mockPurchase.orderNumber}</p>
                <p>Customer: {mockPurchase.customerName}</p>
                <p>Email: {mockPurchase.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Review CTA */}
        <div className="space-y-4 border-t pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Share Your Experience</h2>
            <p className="text-muted-foreground">
              Our customer service team would love to hear from you! Share your thoughts in just 2 minutes through a quick call.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full text-lg py-6 gradient-primary shadow-glow hover:opacity-90 transition-all"
            onClick={() => navigate("/gemini-live")}
          >
            <Phone className="mr-2 h-6 w-6" />
            Start Review Call (2 min)
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            🎁 Get 10% off your next purchase for completing the review
          </p>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-muted-foreground space-x-4 pt-4 border-t">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-primary transition-colors"
          >
            View Dashboard
          </button>
          <span>•</span>
          <button
            onClick={() => navigate("/home")}
            className="hover:text-primary transition-colors"
          >
            Back to Home
          </button>
        </div>
      </Card>
    </div>
  );
};

export default ProductPurchase;
