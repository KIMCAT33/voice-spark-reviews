import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Phone, ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import lipstickImage from "@/assets/red-lipstick.jpg";
import { StepProgressBar } from "@/components/StepProgressBar";

interface Product {
  name: string;
  price: string;
  quantity: number;
  image: string | null;
}

const ProductPurchase = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get products and customer info from URL params (from checkout) or use defaults
  const productsParam = searchParams.get('products');
  const customerNameFromUrl = searchParams.get('customer');
  const emailFromUrl = searchParams.get('email');

  // Parse products from URL or use default
  let products: Product[] = [{ name: "Rouge Velvet Matte Lipstick", price: "0", quantity: 1, image: null }];
  if (productsParam) {
    try {
      products = JSON.parse(decodeURIComponent(productsParam));
    } catch (error) {
      console.error("Failed to parse products from URL:", error);
      // Use default products on parse error
    }
  }

  // Customer data - Generate guest name if not provided (for demo purposes)
  const generateGuestName = () => {
    const guestNames = [
      'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Avery',
      'Jamie', 'Quinn', 'Dakota', 'Skylar', 'Cameron', 'Blake', 'Reese', 'Sage'
    ];
    const randomIndex = Math.floor(Math.random() * guestNames.length);
    return `Guest ${guestNames[randomIndex]}`;
  };
  
  const customerName = customerNameFromUrl || generateGuestName();
  const email = emailFromUrl || `${customerName.toLowerCase().replace(/\s+/g, '.')}@demo.com`;
  const orderNumber = "ORD-" + Math.random().toString(36).substring(2, 11).toUpperCase();


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-3 xs:p-4 sm:p-6">
      {/* Back to Home */}
      <div className="container mx-auto max-w-2xl mb-4">
        <Button variant="ghost" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Home
        </Button>
      </div>
      
      <div className="flex items-center justify-center">
        <Card className="max-w-2xl w-full p-5 xs:p-6 sm:p-8 md:p-12 shadow-card space-y-6 sm:space-y-8">
          {/* Progress Bar */}
        <div className="pb-4 border-b">
          <StepProgressBar 
            current={1} 
            total={3} 
            label="Step 1/3: Purchase Complete"
            steps={["Purchase Complete", "Sharing Your Feedback", "View Dashboard"]}
          />
        </div>

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

        {/* Order Info */}
        <div className="space-y-3 xs:space-y-4 bg-muted/50 rounded-lg p-4 xs:p-5 sm:p-6">
          <div className="text-xs xs:text-sm text-muted-foreground space-y-0.5 xs:space-y-1">
            <p className="break-all">Order Number: {orderNumber}</p>
            <p>Customer: {customerName}</p>
            <p className="break-all">Email: {email}</p>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-3 xs:space-y-4">
          <h3 className="text-lg xs:text-xl font-semibold px-2">Ordered Products</h3>
          <div className="space-y-3">
            {products.map((product, index) => (
              <div 
                key={index}
                className="flex flex-col xs:flex-row items-center xs:items-start gap-4 xs:gap-5 sm:gap-6 bg-muted/50 rounded-lg p-4 xs:p-5 sm:p-6"
              >
                <div className="w-28 h-28 xs:w-24 xs:h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-white shadow-md flex-shrink-0">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img 
                      src={lipstickImage} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 space-y-2 xs:space-y-2.5 sm:space-y-3 text-center xs:text-left w-full">
                  <div>
                    <h3 className="font-semibold text-lg xs:text-lg sm:text-xl break-words">
                      {product.name}
                    </h3>
                    <p className="text-xs xs:text-sm text-muted-foreground">
                      Quantity: {product.quantity} × ${parseFloat(product.price).toFixed(2)}
                    </p>
                    <p className="text-sm xs:text-base font-medium mt-1">
                      ${(parseFloat(product.price) * product.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
            onClick={() => navigate(`/gemini-live?products=${encodeURIComponent(JSON.stringify(products))}&customer=${encodeURIComponent(customerName)}`)}
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
    </div>
  );
};

export default ProductPurchase;
