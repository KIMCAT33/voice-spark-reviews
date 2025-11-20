/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific License.
 */

import { useEffect, useRef, useState, memo, useCallback } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import "./review-agent.scss";
import { ReviewCompletion } from "./ReviewCompletion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { isGenAILiveClient } from "@/lib/type-guards";

// Review data structure
export interface ReviewData {
  productName?: string;
  overallRating?: number;
  positivePoints?: string[];
  negativePoints?: string[];
  improvementSuggestions?: string[];
  repurchaseIntent?: boolean;
  additionalComments?: string;
  sentiment?: "positive" | "neutral" | "negative";
}

// Function declaration for saving review data
const saveReviewDeclaration: FunctionDeclaration = {
  name: "save_review_data",
  description: "Saves customer review responses as structured data. Collects answers to each question to complete the review data.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      questionNumber: {
        type: Type.NUMBER,
        description: "Current question number (1-5)",
      },
      answer: {
        type: Type.STRING,
        description: "Customer's answer content",
      },
      reviewData: {
        type: Type.OBJECT,
        description: "Accumulated review data",
        properties: {
          productName: {
            type: Type.STRING,
            description: "Product name",
          },
          overallRating: {
            type: Type.NUMBER,
            description: "Overall rating (1-5)",
          },
          positivePoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of positive points",
          },
          negativePoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of negative points",
          },
          improvementSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of improvement suggestions",
          },
          repurchaseIntent: {
            type: Type.BOOLEAN,
            description: "Repurchase intent (true/false)",
          },
          additionalComments: {
            type: Type.STRING,
            description: "Additional comments",
          },
          sentiment: {
            type: Type.STRING,
            enum: ["positive", "neutral", "negative"],
            description: "Overall sentiment analysis",
          },
        },
      },
    },
    required: ["questionNumber", "answer", "reviewData"],
  },
};

function ReviewAgentComponent({ 
  products = [{ name: "VOIX Beauty Product", price: "0" }],
  customerName
}: { 
  products?: Array<{name: string, price: string}>;
  customerName?: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedModel = searchParams.get('model') || 'gemini'; // URL에서 모델 확인
  const [reviewData, setReviewData] = useState<ReviewData>({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedReviewId, setSavedReviewId] = useState<string | null>(null);
  const { client, setConfig, setModel, connected, setupComplete, disconnect } = useLiveAPIContext();
  const reviewContainerRef = useRef<HTMLDivElement>(null);
  const messageAlreadySent = useRef(false);

  // Format product list for the prompt
  const productList = products.map(p => p.name).join(", ");
  const productCount = products.length;

  // Save review to Supabase database
  const saveReviewToDatabase = useCallback(async (finalReviewData: ReviewData) => {
    try {
      setIsSaving(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // For demo purposes, allow saving without auth
        console.warn("User not authenticated, saving without user_id");
      }

      // Map ReviewData to database schema
      // Generate a guest name if customer name is not provided (for demo purposes)
      const finalCustomerName = customerName || (() => {
        const guestNames = [
          'Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Avery',
          'Jamie', 'Quinn', 'Dakota', 'Skylar', 'Cameron', 'Blake', 'Reese', 'Sage'
        ];
        const randomIndex = Math.floor(Math.random() * guestNames.length);
        return `Guest ${guestNames[randomIndex]}`;
      })();
      
      const reviewDataToSave = {
        product_name: finalReviewData.productName || products[0]?.name || "VOIX Beauty Product",
        customer_name: finalCustomerName,
        customer_emotion: finalReviewData.sentiment === "positive" 
          ? "happy" 
          : finalReviewData.sentiment === "negative" 
          ? "frustrated" 
          : "neutral",
        recommendation_score: finalReviewData.overallRating || 3,
        review_summary: finalReviewData.additionalComments || 
          `Rating: ${finalReviewData.overallRating}/5. ${finalReviewData.positivePoints?.join(", ") || ""}`,
        key_positive_points: finalReviewData.positivePoints || [],
        key_negative_points: finalReviewData.negativePoints || [],
        improvement_suggestions: finalReviewData.improvementSuggestions || [],
        user_id: user?.id || null,
      };

      // Validate with zod schema
      const { reviewSchema } = await import("@/lib/validation");
      const validatedData = reviewSchema.parse(reviewDataToSave);

      const { data, error } = await supabase
        .from("reviews")
        .insert(validatedData)
        .select()
        .single();

      if (error) {
        console.error("Error saving review:", error);
        toast({
          title: "Error saving review",
          description: "Your review couldn't be saved. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Review saved successfully:", data);
      setSavedReviewId(data.id);
      
      toast({
        title: "Review saved!",
        description: "Your feedback has been recorded.",
      });

      // Navigate to dashboard with highlight after a short delay
      setTimeout(() => {
        navigate(`/dashboard?highlightReview=${data.id}`);
      }, 2000);
      
    } catch (error: any) {
      console.error("Error saving review:", error);
      
      const errorMessage = error.name === "ZodError" 
        ? "The review data didn't meet our requirements. Please try again with valid information."
        : error.message || "Failed to save review";
      
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [products, toast, navigate, customerName]);

  // Initial setup: Beauty product review collection agent persona
  useEffect(() => {
    setModel("models/gemini-2.0-flash-exp");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are a warm, empathetic beauty product review specialist who excels at helping customers articulate their experiences.

**CRITICAL LANGUAGE REQUIREMENT: You MUST respond ONLY in English. Always speak English regardless of what language the customer uses.**

**Customer & Purchase Context:**
- Customer Name: Valued Customer
- Products Purchased: ${productList}
- Total Items: ${productCount}

**CRITICAL: You MUST start the conversation IMMEDIATELY without waiting for user input. Begin speaking right away.**

You already know the product${productCount > 1 ? 's' : ''} they purchased. Start the conversation immediately by acknowledging the specific product${productCount > 1 ? 's' : ''} and asking your first question. DO NOT wait for the user to speak first - you initiate the conversation.

**Your Core Philosophy:**
People often struggle to express their thoughts about products. Your role is to guide them gently, validate their feelings, and help them discover insights they didn't know they had.

**Interview Techniques:**

1. **Opening (Question 1):**
   - Start with: "Hi! Thank you so much for taking time to share your experience with ${productList}. This really helps us create better products. ${productCount > 1 ? "Let's go through each product. Starting with " + products[0].name + ", roughly" : "First, roughly"} how long have you been using it?"
   - Listen to their answer about usage duration.

2. **Overall Experience (Question 2):**
   - Ask: "On a scale from 1 to 5, where 5 is absolutely love it, how would you rate your overall experience?"
   - Then explore WHY: "What's the main reason for that rating?"
   
3. **Digging Deeper - What They Love (Question 3):**
   Use the "5 Senses + Emotion" framework:
   - "Let's talk about what you enjoyed. Starting with the texture - how does it feel when you apply it?"
   - "What about the scent? Does it have a fragrance?"
   - "How does it look on your skin? The finish, the color?"
   - "How does it make you FEEL when you use it? Confident? Pampered?"
   - If answers are brief, probe: "That's great! Can you tell me a specific moment when you really noticed that benefit?"
   - Validate: "I love hearing that detail! That really helps us understand what's working."

4. **Areas for Improvement (Question 4):**
   Make it safe to criticize:
   - "Now, no product is perfect. Was there anything that didn't quite meet your expectations or could be better?"
   - If hesitant: "It's totally okay to share! Maybe something small - like the packaging, the price, how long it lasts?"
   - Dig deeper: "Can you walk me through what happens when [their issue]? Like, at what point do you notice it?"
   - Frame positively: "That's really valuable feedback. If we could wave a magic wand and improve one thing, what would have the biggest impact for you?"

5. **Future Intent & Final Thoughts (Question 5):**
   - "Would you purchase this product again, or recommend it to a friend?"
   - "One last thing - is there anything else about your experience we haven't covered? Maybe how it compares to other products, or how it fits into your routine?"

**Advanced Probing Techniques:**

When answers are vague, use these:
- **Comparison:** "How does this compare to other similar products you've tried?"
- **Specificity:** "You mentioned it's long-lasting - roughly how many hours would you say?"
- **Story:** "Tell me about the first time you used it. What was that like?"
- **Contrast:** "What did you expect vs what you actually experienced?"
- **Context:** "What time of day do you usually use this? Special occasions or daily?"

**Validation & Encouragement:**

Throughout the conversation:
- "That's such helpful detail!"
- "I really appreciate you taking time to explain that."
- "This is exactly the kind of insight that helps us improve."
- "You're giving us such a clear picture, thank you!"

**Response Quality Indicators:**

GOOD answers include: specific details, emotions, comparisons, time references, sensory descriptions
BRIEF answers that need follow-up: "It's good", "I like it", "Nothing really"

**Data Collection:**

After each substantial answer, call save_review_data:
- Always set productName to the product being discussed (from: ${productList})
- Extract SPECIFIC positive points (not just "good color" but "beautiful color that matches my skin tone")
- Note negative points with context ("slightly drying after 6+ hours of wear")
- Capture emotional language for sentiment analysis
${productCount > 1 ? "- Ask about each product separately, going through the 5 questions for each one\n- After completing questions for one product, move to the next product naturally" : ""}
- Question 1: Basic info (usage duration) - set productName
- Question 2: Rating (aim for specific rating 1-5)
- Question 3: Deep dive on positives (aim for 3-5 specific points)
- Question 4: Improvement areas (1-3 constructive points)
- Question 5: Future intent + any bonus insights

**Closing:**

After Question 5${productCount > 1 ? ' for all products' : ''}, warmly conclude:
"Thank you so much for sharing such thoughtful feedback about ${productList}! Your insights about [mention 1-2 specific things they said] are incredibly valuable. We'll make sure our product team sees this. As a thank you, you'll receive a special discount code via email shortly. Have a wonderful day!"`,
          },
        ],
      },
      tools: [
        { functionDeclarations: [saveReviewDeclaration] },
      ],
    });
  }, [setConfig, setModel, products]);

  // Tool Call handler: Collect review data
  useEffect(() => {
    const onToolCall = (toolCall: LiveServerToolCall) => {
      if (!toolCall.functionCalls) {
        return;
      }

      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === saveReviewDeclaration.name
      );

      if (fc) {
        const args = fc.args as any;
        const { questionNumber, answer, reviewData: newReviewData } = args;

        console.log("Review data collected:", {
          questionNumber,
          answer,
          reviewData: newReviewData,
        });

        // Accumulate review data instead of replacing
        setReviewData(prev => {
          const updatedReviewData = {
            ...prev,
            ...newReviewData,
            positivePoints: newReviewData.positivePoints || prev.positivePoints,
            negativePoints: newReviewData.negativePoints || prev.negativePoints,
            improvementSuggestions: newReviewData.improvementSuggestions || prev.improvementSuggestions,
          };

          // Check if all questions are complete (5 questions completed)
          if (questionNumber >= 5) {
            setIsComplete(true);
            // Disconnect the call after finishing interview
            setTimeout(() => {
              disconnect();
            }, 2000);
            
            // Save review to database using the updated review data
            // Use the updatedReviewData we just computed to avoid stale closure
            saveReviewToDatabase(updatedReviewData);
          }

          return updatedReviewData;
        });
        setCurrentQuestion(questionNumber);

        // Send Tool Response
        setTimeout(
          () => {
            if (client && isGenAILiveClient(client)) {
              client.sendToolResponse({
                functionResponses: toolCall.functionCalls?.map((fc) => ({
                  response: {
                    output: {
                      success: true,
                      message: "Review data has been successfully saved.",
                    },
                  },
                  id: fc.id,
                  name: fc.name,
                })),
              });
            }
          },
          200
        );
      }
    };

    if (client && isGenAILiveClient(client)) {
      client.on("toolcall", onToolCall);
      return () => {
        client.off("toolcall", onToolCall);
      };
    }
  }, [client, disconnect, saveReviewToDatabase]);

  // Send initial message when session is ready
  useEffect(() => {
    const sendInitialMessage = () => {
      if (currentQuestion === 0 && !messageAlreadySent.current && connected && setupComplete && client) {
        console.log("📝 Conditions met - sending initial greeting message...");
        console.log("  - currentQuestion:", currentQuestion);
        console.log("  - messageAlreadySent:", messageAlreadySent.current);
        console.log("  - connected:", connected);
        console.log("  - setupComplete:", setupComplete);
        
        messageAlreadySent.current = true;
        
        // Use a small delay to ensure the session is fully ready
        setTimeout(() => {
          try {
            const productName = products[0]?.name || 'the product';
            
            console.log('🔍 [ReviewAgent] Model selection:', {
              urlParam: selectedModel,
              isGeminiClient: isGenAILiveClient(client),
              clientType: client?.constructor?.name
            });
            
            // URL 파라미터 기반 분기 (더 명확함)
            if (selectedModel === 'openai') {
              console.log("🎯 [ReviewAgent] Using OpenAI model - waiting for user audio input");
              // OpenAI Server VAD 모드: 사용자의 음성 입력을 자동으로 감지하고 응답
              // 별도의 초기 메시지 없이 바로 오디오 대화 시작
              console.log("✅ [OpenAI] Ready for voice conversation - speak to start");
            } else {
              // Gemini: send text message
              console.log("🎯 [ReviewAgent] Using Gemini model");
              if (client && isGenAILiveClient(client)) {
                client.send([
                  {
                    text: `Start the interview by greeting the customer warmly and asking about their experience with ${productName}.`,
                  },
                ]);
                console.log("✅ [Gemini] Initial message sent successfully");
              } else {
                console.warn("⚠️ [Gemini] Client not ready or incorrect type");
              }
            }
          } catch (error) {
            console.error("❌ Failed to send initial message:", error);
            messageAlreadySent.current = false;
          }
        }, 500);
      }
    };

    // Check if setup is already complete (handles race condition)
    if (setupComplete && connected) {
      console.log("🎉 Setup already complete - sending message immediately");
      sendInitialMessage();
    }

    // Also listen for setupcomplete event
    const onSetupComplete = () => {
      console.log("🎉 Setup complete event received!");
      sendInitialMessage();
    };

    console.log("🔧 Setting up setupcomplete listener");
    console.log("  - connected:", connected);
    console.log("  - setupComplete:", setupComplete);
    if (client) {
      if (isGenAILiveClient(client)) {
        client.on("setupcomplete", onSetupComplete);
      } else if (typeof (client as any).on === 'function') {
        (client as any).on("setupcomplete", onSetupComplete);
      }
      
      return () => {
        console.log("🧹 Cleaning up setupcomplete listener");
        if (isGenAILiveClient(client)) {
          client.off("setupcomplete", onSetupComplete);
        } else if (typeof (client as any).off === 'function') {
          (client as any).off("setupcomplete", onSetupComplete);
        }
      };
    }
  }, [client, currentQuestion, connected, setupComplete, products]);
  
  // Reset message flag when disconnected
  useEffect(() => {
    if (!connected) {
      messageAlreadySent.current = false;
      console.log("🔄 Connection lost - reset message flag");
    }
  }, [connected]);

  // Show completion screen when interview is done
  if (isComplete && Object.keys(reviewData).length > 0) {
    return (
      <div className="review-agent-container" ref={reviewContainerRef}>
        <ReviewCompletion 
          reviewData={reviewData} 
          isSaving={isSaving}
          savedReviewId={savedReviewId}
        />
      </div>
    );
  }

  return (
    <div className="review-agent-container" ref={reviewContainerRef}>
      {!connected && (
        <div className="connection-guide">
          <div className="guide-card-combined">
            <div className="header-icon">
              <Sparkles className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h2>
              <span className="gradient-text">Share Your Voice, Get Rewarded</span>
            </h2>
            <p className="subtitle">2-minute voice review to unlock 10% discount & priority support</p>
            
            <div className="divider"></div>
            
            <div className="guide-steps">
              <div className="step">
                <span className="step-number">1</span>
                <span className="step-text">Start Call</span>
              </div>
              <div className="step">
                <span className="step-number">2</span>
                <span className="step-text">Answer Questions</span>
              </div>
              <div className="step">
                <span className="step-number">3</span>
                <span className="step-text">Receive 10% Discount</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {connected && (
        <div className="review-header">
          <div className="header-icon">
            <Sparkles className="w-12 h-12 text-primary animate-pulse" />
          </div>
          <h2>
            <span className="gradient-text">Share Your Voice, Get Rewarded</span>
          </h2>
          <p className="subtitle">
            <span className="flex items-center gap-2 justify-center">
              <span className="status-dot"></span>
              Question {currentQuestion}/5 • Earn 10% discount!
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

export const ReviewAgent = memo(ReviewAgentComponent);

