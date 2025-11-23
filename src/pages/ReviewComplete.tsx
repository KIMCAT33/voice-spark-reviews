import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ReviewCompletion } from "@/components/review-agent/ReviewCompletion";

const ReviewComplete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reviewData = location.state?.reviewData;

  useEffect(() => {
    // Redirect to dashboard if no review data
    if (!reviewData) {
      console.warn("No review data found, redirecting to dashboard");
      navigate("/dashboard");
    }
  }, [reviewData, navigate]);

  if (!reviewData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <ReviewCompletion 
        reviewData={reviewData}
        isSaving={false}
        savedReviewId={location.state?.savedReviewId || null}
      />
    </div>
  );
};

export default ReviewComplete;
