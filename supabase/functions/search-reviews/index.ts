import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Processing search query:", query);

    // Use Lovable AI to interpret the natural language query
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a database query assistant. Convert natural language questions about customer reviews into structured database queries.

Available fields in the reviews table:
- product_name (TEXT)
- customer_name (TEXT)
- customer_emotion (TEXT: 'happy', 'satisfied', 'neutral', 'frustrated')
- recommendation_score (INTEGER: 1-5)
- review_summary (TEXT)
- key_positive_points (TEXT[])
- key_negative_points (TEXT[])
- improvement_suggestions (TEXT[])
- created_at (TIMESTAMPTZ)

Respond with a JSON object containing:
{
  "filters": {
    "emotion": "happy" | "satisfied" | "neutral" | "frustrated" | null,
    "minScore": 1-5 or null,
    "maxScore": 1-5 or null,
    "productKeyword": "string" or null,
    "timeframe": "today" | "week" | "month" | null
  },
  "searchKeywords": ["keyword1", "keyword2"],
  "explanation": "Brief explanation of the search"
}`
          },
          {
            role: "user",
            content: query
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "interpret_query",
            description: "Convert natural language query to database filters",
            parameters: {
              type: "object",
              properties: {
                filters: {
                  type: "object",
                  properties: {
                    emotion: { type: "string", enum: ["happy", "satisfied", "neutral", "frustrated"], nullable: true },
                    minScore: { type: "integer", minimum: 1, maximum: 5, nullable: true },
                    maxScore: { type: "integer", minimum: 1, maximum: 5, nullable: true },
                    productKeyword: { type: "string", nullable: true },
                    timeframe: { type: "string", enum: ["today", "week", "month"], nullable: true }
                  }
                },
                searchKeywords: {
                  type: "array",
                  items: { type: "string" }
                },
                explanation: { type: "string" }
              },
              required: ["filters", "searchKeywords", "explanation"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "interpret_query" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service payment required. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to process query" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData));

    // Extract tool call response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const parsedQuery = JSON.parse(toolCall.function.arguments);
    console.log("Parsed query:", parsedQuery);

    // Build Supabase query
    let dbQuery = supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    const { filters, searchKeywords } = parsedQuery;

    // Apply filters
    if (filters.emotion) {
      dbQuery = dbQuery.eq("customer_emotion", filters.emotion);
    }
    if (filters.minScore) {
      dbQuery = dbQuery.gte("recommendation_score", filters.minScore);
    }
    if (filters.maxScore) {
      dbQuery = dbQuery.lte("recommendation_score", filters.maxScore);
    }
    if (filters.productKeyword) {
      dbQuery = dbQuery.ilike("product_name", `%${filters.productKeyword}%`);
    }
    if (filters.timeframe) {
      const now = new Date();
      let startDate = new Date();
      if (filters.timeframe === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (filters.timeframe === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (filters.timeframe === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }
      dbQuery = dbQuery.gte("created_at", startDate.toISOString());
    }

    const { data: reviews, error: dbError } = await dbQuery;

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Database query failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter by keywords in text fields
    let filteredReviews = reviews || [];
    if (searchKeywords.length > 0) {
      filteredReviews = filteredReviews.filter(review => {
        const searchText = [
          review.review_summary,
          review.product_name,
          ...(review.key_positive_points || []),
          ...(review.key_negative_points || []),
          ...(review.improvement_suggestions || [])
        ].join(" ").toLowerCase();

        return searchKeywords.some((keyword: string) => 
          searchText.includes(keyword.toLowerCase())
        );
      });
    }

    return new Response(
      JSON.stringify({
        results: filteredReviews,
        explanation: parsedQuery.explanation,
        count: filteredReviews.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Search function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});