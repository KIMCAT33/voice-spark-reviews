import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cartStore";
import { ShopifyProduct, fetchProductByHandle } from "@/lib/shopify";
import { toast } from "sonner";
import { ShoppingCart, ArrowLeft, Package, Check, Loader2 } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    const loadProduct = async () => {
      if (handle) {
        const data = await fetchProductByHandle(handle);
        setProduct(data);
        setLoading(false);
      }
    };
    loadProduct();
  }, [handle]);

  const handleAddToCart = () => {
    if (!product) return;
    
    const variant = product.variants.edges[selectedVariant]?.node;
    if (!variant) {
      toast.error('This product is currently unavailable.');
      return;
    }

    const cartItem = {
      product: { node: product } as ShopifyProduct,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success('Added to cart!', {
      position: 'top-center'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <Button onClick={() => navigate('/shop')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Store
          </Button>
        </div>
      </div>
    );
  }

  const currentVariant = product.variants.edges[selectedVariant]?.node;
  const currentImage = product.images.edges[0]?.node;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Home
            </Button>
            <span className="text-muted-foreground">/</span>
            <Button variant="ghost" onClick={() => navigate('/shop')}>
              Store
            </Button>
          </div>
          <CartDrawer />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-secondary/20">
              {currentImage ? (
                <img
                  src={currentImage.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
            
            {product.images.edges.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.edges.slice(1, 5).map((edge, idx) => (
                  <div key={idx} className="aspect-square rounded-md overflow-hidden bg-secondary/20">
                    <img
                      src={edge.node.url}
                      alt={`${product.title} ${idx + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                VOIX Beauty
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">{product.title}</h1>
              <p className="text-3xl font-bold text-primary">
                {currentVariant?.price.currencyCode} {parseFloat(currentVariant?.price.amount || '0').toFixed(2)}
              </p>
            </div>

            <div className="border-t border-b py-4">
              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'No product description available.'}
              </p>
            </div>

            {product.variants.edges.length > 1 && (
              <div>
                <h3 className="font-semibold mb-3">Select Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.edges.map((edge, idx) => (
                    <Button
                      key={edge.node.id}
                      variant={selectedVariant === idx ? "default" : "outline"}
                      onClick={() => setSelectedVariant(idx)}
                      disabled={!edge.node.availableForSale}
                    >
                      {edge.node.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>30-Day Money Back Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Provide Feedback via Voice Review After Purchase</span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleAddToCart}
                disabled={!currentVariant?.availableForSale}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {currentVariant?.availableForSale ? 'Add to Cart' : 'Out of Stock'}
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Leave a voice review after purchase and help improve the brand
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
