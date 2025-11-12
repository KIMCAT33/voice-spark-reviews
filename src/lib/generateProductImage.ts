import { supabase } from "@/integrations/supabase/client";

export async function generateProductImage(productName: string, productType: string): Promise<string> {
  const prompts: Record<string, string> = {
    'Cream': `Professional product photography of a luxury face cream in an elegant white jar with gold accents. Clean white background, studio lighting, skincare product, high-end beauty brand, ultra high resolution, commercial photography style`,
    'Lotion': `Professional product photography of a premium body lotion in a sleek white pump bottle. Clean white background, studio lighting, body care product, luxury beauty brand, ultra high resolution, commercial photography style`,
    'Toner': `Professional product photography of a refreshing facial toner in a clear glass spray bottle with rose-tinted liquid. Clean white background, studio lighting, facial care product, luxury beauty brand, ultra high resolution, commercial photography style`,
  };

  const prompt = prompts[productType] || `Professional product photography of ${productName}. Clean white background, studio lighting, beauty product, ultra high resolution`;

  const { data, error } = await supabase.functions.invoke('generate-product-image', {
    body: { prompt }
  });

  if (error) {
    throw new Error(`Failed to generate image: ${error.message}`);
  }

  if (!data.imageUrl) {
    throw new Error('No image URL returned');
  }

  return data.imageUrl;
}
