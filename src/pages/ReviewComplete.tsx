import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReviewCompletion } from "@/components/review-agent/ReviewCompletion";

const ReviewComplete = () => {
  const navigate = useNavigate();
  const [reviewData, setReviewData] = useState<any>(null);
  const [savedReviewId, setSavedReviewId] = useState<string | null>(null);

  useEffect(() => {
    // Get review data from sessionStorage
    const storedData = sessionStorage.getItem('completedReview');
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log("✅ Retrieved review data from sessionStorage:", parsed);
        setReviewData(parsed.reviewData);
        setSavedReviewId(parsed.savedReviewId);
        
        // Clear the data after retrieval
        sessionStorage.removeItem('completedReview');
      } catch (error) {
        console.error("Error parsing stored review data:", error);
        // Use sample data instead of redirecting
        setReviewData(getSampleReviewData());
      }
    } else {
      console.warn("No review data found in sessionStorage, showing sample data");
      // Show sample data for preview instead of redirecting
      setReviewData(getSampleReviewData());
    }
  }, [navigate]);

  const getSampleReviewData = () => ({
    productName: "Hydrating Face Cream",
    overallRating: 5,
    positivePoints: ["Long-lasting hydration", "Smooth texture", "Great scent"],
    negativePoints: [],
    sentiment: "positive" as const
  });

  if (!reviewData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <ReviewCompletion 
        reviewData={reviewData}
        isSaving={false}
        savedReviewId={savedReviewId}
      />
    </div>
  );
};

export default ReviewComplete;
