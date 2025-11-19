import { z } from 'zod';

export const reviewSchema = z.object({
  product_name: z.string().min(1, "Product name is required").max(200, "Product name too long"),
  customer_name: z.string().max(100, "Customer name too long").optional(),
  customer_emotion: z.enum(['happy', 'satisfied', 'neutral', 'frustrated'] as const),
  recommendation_score: z.number().int().min(1).max(5, "Score must be between 1 and 5"),
  review_summary: z.string().min(1, "Review summary is required").max(2000, "Review summary too long"),
  key_positive_points: z.array(z.string().max(500)).max(20, "Too many positive points"),
  key_negative_points: z.array(z.string().max(500)).max(20, "Too many negative points"),
  improvement_suggestions: z.array(z.string().max(500)).max(20, "Too many suggestions"),
  user_id: z.string().uuid().optional().nullable(),
});

export type ReviewData = z.infer<typeof reviewSchema>;
