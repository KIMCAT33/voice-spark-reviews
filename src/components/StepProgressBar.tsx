import { CheckCircle } from "lucide-react";

interface StepProgressBarProps {
  current: number;
  total: number;
  label?: string;
  steps?: string[];
}

export const StepProgressBar = ({ 
  current, 
  total, 
  label,
  steps = []
}: StepProgressBarProps) => {
  const percentage = (current / total) * 100;

  const defaultSteps = [
    "Purchase Complete",
    "Sharing Your Feedback",
    "View Dashboard"
  ];

  const stepLabels = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="w-full space-y-4">
      {label && (
        <div className="text-center">
          <p className="text-sm font-semibold text-muted-foreground">
            {label}
          </p>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-start">
        {Array.from({ length: total }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < current;
          const isCurrent = stepNumber === current;
          const stepLabel = stepLabels[index] || `Step ${stepNumber}`;

          return (
            <div
              key={stepNumber}
              className="flex flex-col items-center flex-1 max-w-[200px]"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{stepNumber}</span>
                )}
              </div>
              <p
                className={`text-xs mt-2 text-center ${
                  isCurrent
                    ? "font-semibold text-primary"
                    : isCompleted
                    ? "text-muted-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {stepLabel}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

