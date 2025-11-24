"use client";

interface ProgressBarProps {
  percentage: number;
  color?: "blue" | "green" | "yellow" | "red";
  showLabel?: boolean;
  height?: "sm" | "md" | "lg";
}

const ProgressBar = ({
  percentage,
  color = "blue",
  showLabel = true,
  height = "md",
}: ProgressBarProps) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
  };

  const heightClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progreso</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 rounded-full ${heightClasses[height]}`}
      >
        <div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
