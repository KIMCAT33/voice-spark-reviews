-- Create reviews table with full CRM data structure
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  customer_name TEXT,
  customer_emotion TEXT NOT NULL CHECK (customer_emotion IN ('happy', 'satisfied', 'neutral', 'frustrated')),
  recommendation_score INTEGER NOT NULL CHECK (recommendation_score >= 1 AND recommendation_score <= 5),
  review_summary TEXT NOT NULL,
  key_positive_points TEXT[] DEFAULT '{}',
  key_negative_points TEXT[] DEFAULT '{}',
  improvement_suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view reviews)
CREATE POLICY "Anyone can view reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Public insert access (anyone can submit reviews)
CREATE POLICY "Anyone can submit reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX idx_reviews_emotion ON public.reviews(customer_emotion);
CREATE INDEX idx_reviews_product ON public.reviews(product_name);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();

-- Enable realtime for live dashboard updates
ALTER TABLE public.reviews REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;