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
        navigate("/dashboard");
      }
    } else {
      console.warn("No review data found in sessionStorage, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [navigate]);

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
