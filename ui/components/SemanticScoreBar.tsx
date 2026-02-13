import React from "react";

interface SemanticScoreBarProps {
  score: number;           // 0–100 from backend
  label?: string;
  height?: number;         // px
  showValue?: boolean;
  colorClass?: string;     // optional override
}

/**
 * STRICT BACKEND AUTHORITY
 * - No score interpretation
 * - No thresholds
 * - UI safety clamping only
 */

const clamp = (value: number): number => {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
};

export const SemanticScoreBar: React.FC<
  SemanticScoreBarProps
> = ({
  score,
  label,
  height = 10,
  showValue = true,
  colorClass = "bg-[#ff6b35]", // 🔥 portfolio orange
}) => {
  const safeScore = clamp(score);

  return (
    <div className="w-full">

      {label && (
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span className="font-medium">{label}</span>
          {showValue && (
            <span className="text-[#ff6b35] font-semibold">
              {safeScore.toFixed(1)}%
            </span>
          )}
        </div>
      )}

      <div
        className="w-full bg-[#2a2a2f] rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className={`${colorClass} transition-all duration-700 ease-out`}
          style={{
            width: `${safeScore}%`,
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};
