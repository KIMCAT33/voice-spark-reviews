import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";
import { generateProductImage } from "@/lib/generateProductImage";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const products = [
  { id: "10139789918525", name: "Hydrating Face Cream", type: "Cream" },
  { id: "10139790180669", name: "Nourishing Body Lotion", type: "Lotion" },
  { id: "10139792245053", name: "Refreshing Facial Toner", type: "Toner" },
];

export default function GenerateProductImages() {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<Record<string, string>>({});

  const generateImage = async (product: typeof products[0]) => {
    setGenerating(prev => ({ ...prev, [product.id]: true }));
    setErrors(prev => ({ ...prev, [product.id]: "" }));

    try {
      const imageUrl = await generateProductImage(product.name, product.type);
      setImages(prev => ({ ...prev, [product.id]: imageUrl }));
      setCompleted(prev => ({ ...prev, [product.id]: true }));
      toast.success(`Generated image for ${product.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate image";
      setErrors(prev => ({ ...prev, [product.id]: errorMessage }));
      toast.error(`Failed to generate ${product.name} image`);
    } finally {
      setGenerating(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const generateAll = async () => {
    for (const product of products) {
      if (!completed[product.id]) {
        await generateImage(product);
        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Generate Product Images</h1>
            <p className="text-muted-foreground">AI-powered product photography</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Generate professional product images using AI
            </p>
            <Button 
              onClick={generateAll}
              disabled={Object.values(generating).some(v => v)}
            >
              {Object.values(generating).some(v => v) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate All"
              )}
            </Button>
          </div>

          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.type}</p>
                    </div>
                    {completed[product.id] && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                    {errors[product.id] && (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <Button
                    onClick={() => generateImage(product)}
                    disabled={generating[product.id]}
                    size="sm"
                  >
                    {generating[product.id] ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : completed[product.id] ? (
                      "Regenerate"
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>

                {errors[product.id] && (
                  <p className="text-sm text-red-500 mt-2">{errors[product.id]}</p>
                )}

                {images[product.id] && (
                  <div className="mt-4">
                    <img
                      src={images[product.id]}
                      alt={product.name}
                      className="w-full max-w-md rounded-lg border"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-2">Note</h3>
          <p className="text-sm text-muted-foreground">
            Generated images are displayed here for preview. To add them to your Shopify products,
            you would need to upload them manually to Shopify admin or implement an image upload feature.
          </p>
        </Card>
      </div>
    </div>
  );
}
