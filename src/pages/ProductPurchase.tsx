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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-3 xs:p-4 sm:p-6">
      <Card className="max-w-2xl w-full p-5 xs:p-6 sm:p-8 md:p-12 shadow-card space-y-6 sm:space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 xs:w-18 xs:h-18 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl xs:text-2xl sm:text-3xl md:text-3xl font-bold px-2 break-words">
            Thank You for Your Purchase!
          </h1>
          <p className="text-sm xs:text-base text-muted-foreground px-2">
            Your order has been confirmed and will be shipped soon.
          </p>
        </div>

        {/* Product Image & Details */}
        <div className="space-y-3 xs:space-y-4 bg-muted/50 rounded-lg p-4 xs:p-5 sm:p-6">
          <div className="flex flex-col xs:flex-row items-center xs:items-start gap-4 xs:gap-5 sm:gap-6">
            <div className="w-28 h-28 xs:w-24 xs:h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0">
              <img 
                src={lipstickImage} 
                alt={mockPurchase.productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2 xs:space-y-2.5 sm:space-y-3 text-center xs:text-left w-full">
              <div>
                <h3 className="font-semibold text-lg xs:text-lg sm:text-xl break-words">
                  {mockPurchase.productName}
                </h3>
                <p className="text-xs xs:text-sm text-muted-foreground">
                  {mockPurchase.productColor}
                </p>
              </div>
              <div className="text-xs xs:text-sm text-muted-foreground space-y-0.5 xs:space-y-1">
                <p className="break-all">Order Number: {mockPurchase.orderNumber}</p>
                <p>Customer: {mockPurchase.customerName}</p>
                <p className="break-all">Email: {mockPurchase.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Voice Review CTA */}
        <div className="space-y-3 xs:space-y-4 border-t pt-5 xs:pt-6">
          <div className="text-center space-y-1.5 xs:space-y-2">
            <h2 className="text-lg xs:text-xl font-semibold px-2">Share Your Experience</h2>
            <p className="text-xs xs:text-sm sm:text-base text-muted-foreground px-2 leading-relaxed">
              Our customer service team would love to hear from you! Share your thoughts in just 2 minutes through a quick call.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full text-base xs:text-lg py-5 xs:py-6 gradient-primary shadow-glow hover:opacity-90 transition-all"
            onClick={() => navigate("/gemini-live")}
          >
            <Phone className="mr-2 h-5 w-5 xs:h-6 xs:w-6" />
            Start Review Call (2 min)
          </Button>

          <p className="text-center text-xs xs:text-sm text-muted-foreground px-2">
            🎁 Get 10% off your next purchase for completing the review
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ProductPurchase;
