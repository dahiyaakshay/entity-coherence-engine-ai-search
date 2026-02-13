import React from "react";

export type DominanceType =
  | "competitor_dominant"
  | "you_dominant"
  | "competitive";

interface DominanceIndicatorProps {
  dominanceType?: DominanceType;
  dominanceScore?: number; // 0–100 from backend
}

/**
 * STRICT BACKEND AUTHORITY
 * - No recalculation
 * - No thresholds
 * - Pure rendering
 */

function getColor(type: DominanceType) {
  switch (type) {
    case "competitor_dominant":
      return "bg-[#FF6B35]"; // accent orange (threat)
    case "you_dominant":
      return "bg-emerald-500"; // muted green
    default:
      return "bg-gray-500"; // neutral
  }
}

function getLabel(type: DominanceType) {
  switch (type) {
    case "competitor_dominant":
      return "Competitor Dominant";
    case "you_dominant":
      return "You Dominant";
    default:
      return "Competitive";
  }
}

export const DominanceIndicator: React.FC<
  DominanceIndicatorProps
> = ({
  dominanceType = "competitive",
  dominanceScore = 0,
}) => {
  const clampedWidth = Math.min(
    Math.max(dominanceScore, 0),
    100
  );

  return (
    <div className="space-y-3">

      <div className="text-sm font-medium text-gray-200">
        Competitive Dominance
      </div>

      <div className="relative h-3 bg-[#2D2D36] border border-[#3A3A45] rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${getColor(
            dominanceType
          )}`}
          style={{
            width: `${clampedWidth}%`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400">
        <span>{getLabel(dominanceType)}</span>
        <span>{clampedWidth.toFixed(1)}%</span>
      </div>

    </div>
  );
};
