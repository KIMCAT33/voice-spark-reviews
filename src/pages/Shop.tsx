import { useState } from "react";
import { mockProducts, MockProduct } from "@/lib/mockProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { ShoppingCart, Package } from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { useNavigate } from "react-router-dom";

export default function Shop() {
  const [products] = useState<MockProduct[]>(mockProducts);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const handleAddToCart = (product: MockProduct) => {
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) {
      toast.error("This product is currently unavailable.");
      return;
    }

    const cartItem = {
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    };

    addItem(cartItem);
    toast.success("Added to cart!", {
      position: "top-center",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              ← Home
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
            <h2 className="text-3xl font-bold mb-4">No Products Available</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              No products have been added to the store yet.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">All Products</h2>
              <p className="text-muted-foreground">{products.length} products</p>
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
                        {product.node.description || "No description"}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      <p className="text-2xl font-bold">
                        {product.node.priceRange.minVariantPrice.currencyCode}{" "}
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
                        View Details
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
                        {variant?.availableForSale ? "Add" : "Sold Out"}
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
