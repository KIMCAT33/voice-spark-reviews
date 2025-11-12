import { useEffect, useState } from "react";
import { fetchProducts, ShopifyProduct } from "@/lib/shopify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ShoppingCart, Loader2, Package } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { useNavigate } from "react-router-dom";

export default function Shop() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts(20);
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('제품을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ShopifyProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) {
      toast.error('이 제품은 현재 구매할 수 없습니다.');
      return;
    }

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || []
    };
    
    addItem(cartItem);
    toast.success('장바구니에 추가되었습니다!', {
      position: 'top-center'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">제품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              ← 홈으로
            </Button>
            <h1 className="text-2xl font-bold">VOIX Shop</h1>
          </div>
          <CartDrawer />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">제품이 없습니다</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              아직 스토어에 제품이 추가되지 않았습니다. 채팅에서 어떤 제품을 판매하고 싶은지 말씀해주시면 제품을 추가해드리겠습니다!
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">예시:</p>
              <p className="text-sm font-mono bg-secondary/20 inline-block px-4 py-2 rounded">
                "빨간색 립스틱 제품을 $29.99에 추가해줘"
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">모든 제품</h2>
              <p className="text-muted-foreground">{products.length}개의 제품</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => {
                const variant = product.node.variants.edges[0]?.node;
                const image = product.node.images.edges[0]?.node;

                return (
                  <Card 
                    key={product.node.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/product/${product.node.handle}`)}
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
                          <Package className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="line-clamp-1">{product.node.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.node.description || '설명 없음'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {product.node.priceRange.minVariantPrice.currencyCode}{' '}
                        {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.node.handle}`);
                        }}
                      >
                        자세히 보기
                      </Button>
                      <Button 
                        className="flex-1" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={!variant?.availableForSale}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {variant?.availableForSale ? '담기' : '품절'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
