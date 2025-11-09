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

import { useEffect, useRef, useState, memo } from "react";
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

function ReviewAgentComponent() {
  const [reviewData, setReviewData] = useState<ReviewData>({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const { client, setConfig, setModel, connected } = useLiveAPIContext();
  const reviewContainerRef = useRef<HTMLDivElement>(null);

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

**Your Core Philosophy:**
People often struggle to express their thoughts about products. Your role is to guide them gently, validate their feelings, and help them discover insights they didn't know they had.

**Interview Techniques:**

1. **Opening (Question 1):**
   - Start with: "Thank you so much for taking time to share your experience! This really helps us create better products. First, which beauty product did you purchase from us?"
   - Follow up: "Perfect! And roughly how long have you been using it?"

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
- **Comparison:** "How does this compare to other [lipsticks/serums] you've tried?"
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
- Extract SPECIFIC positive points (not just "good color" but "beautiful cherry red that matches my skin tone")
- Note negative points with context ("slightly drying after 6+ hours of wear")
- Capture emotional language for sentiment analysis
- Question 1-2: Basic info + rating
- Question 3: Deep dive on positives (aim for 3-5 specific points)
- Question 4: Improvement areas (1-3 constructive points)
- Question 5: Future intent + any bonus insights

**Closing:**

After Question 5, warmly conclude:
"Thank you so much for sharing such thoughtful feedback! Your insights about [mention 1-2 specific things they said] are incredibly valuable. We'll make sure our product team sees this. As a thank you, you'll receive a special discount code via email shortly. Have a wonderful day!"`,
          },
        ],
      },
      tools: [
        { functionDeclarations: [saveReviewDeclaration] },
      ],
    });
  }, [setConfig, setModel]);

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

        // Update review data
        setReviewData(newReviewData);
        setCurrentQuestion(questionNumber);

        // Check if all questions are complete (5 questions completed)
        if (questionNumber >= 5 && newReviewData.overallRating) {
          setIsComplete(true);
        }

        // Send Tool Response
        setTimeout(
          () =>
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
            }),
          200
        );
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  // Send initial message when connected
  useEffect(() => {
    if (connected && currentQuestion === 0) {
      // Wait a moment after connection, then start initial introduction
      setTimeout(() => {
        client.send([
          {
            text: "Hello! Thank you for purchasing our beauty product. If you could spare a moment to share your honest thoughts about the product, it would be a great help for us to create better products.",
          },
        ]);
      }, 1000);
    }
  }, [connected, client, currentQuestion]);

  // Show completion screen when interview is done
  if (isComplete && Object.keys(reviewData).length > 0) {
    return (
      <div className="review-agent-container" ref={reviewContainerRef}>
        <ReviewCompletion reviewData={reviewData} />
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

