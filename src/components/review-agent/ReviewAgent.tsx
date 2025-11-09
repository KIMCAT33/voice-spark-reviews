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
            text: `You are a friendly and professional product review collection agent for a beauty brand.

**Your Role:**
- Collect detailed reviews about beauty products that customers have purchased
- Elicit honest customer opinions through friendly and natural conversations
- Ask appropriate follow-up questions based on customer responses to gather in-depth feedback

**Conversation Flow:**
1. When first connected, greet the customer warmly and provide a brief introduction about the review survey
2. Collect reviews through 4-5 key questions:
   - Confirm product name
   - Overall satisfaction (1-5 points)
   - What they liked (specifically)
   - What they found disappointing or areas needing improvement
   - Repurchase intent and additional comments

3. Listen to each answer and naturally continue with follow-up questions
4. If the customer's answer is brief, ask follow-up questions like "Could you tell me more specifically?"
5. When all questions are complete, thank them and inform them that the review collection is complete

**Question Examples:**
- "Hello! Thank you for purchasing our product. If you could spare a moment to share your honest thoughts about the product, it would be a great help for us to create better products. First, could you tell me which product you purchased?"
- "Overall, what rating would you give this product? From 1 to 5 points."
- "If there were things you liked, could you tell me specifically what aspects you enjoyed?"
- "Were there any disappointing aspects or areas you think need improvement?"
- "Would you consider purchasing this product again in the future? And if there's anything else you'd like to add, please feel free to share."

**Important:**
- After listening to the customer's answer, call the save_review_data function to save the data
- Update questionNumber for each question and pass the accumulated reviewData
- Extract positive/negative points from the customer's answer and save them to the appropriate fields
- Perform sentiment analysis and update the sentiment field
- Maintain a natural and friendly tone, making customers feel comfortable to respond`,
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
      <div className="review-header">
        <h2>💄 Beauty Product Review Collection</h2>
        <p className="subtitle">
          {connected
            ? `Question ${currentQuestion}/5 in progress...`
            : "Waiting for connection..."}
        </p>
      </div>

      {!connected && (
        <div className="connection-guide">
          <div className="guide-card">
            <span className="guide-icon">🔵</span>
            <p>Click the connect button to start collecting reviews</p>
          </div>
        </div>
      )}
    </div>
  );
}

export const ReviewAgent = memo(ReviewAgentComponent);

