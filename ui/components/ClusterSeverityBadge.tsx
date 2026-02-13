import React from "react";
import { AlertTriangle, Flame, Shield } from "lucide-react";

export type SeverityLevel =
  | "critical"
  | "high"
  | "moderate"
  | "low";

interface ClusterSeverityBadgeProps {
  severityLevel: SeverityLevel;
  size?: "sm" | "md" | "lg";
}

function getSeverityStyles(level: SeverityLevel) {
  switch (level) {
    case "critical":
      return {
        bg: "bg-red-500/15",
        text: "text-red-400",
        border: "border-red-500/40",
        icon: <Flame className="w-3 h-3 mr-1" />,
        label: "Critical",
      };

    case "high":
      return {
        bg: "bg-[#FF6B35]/15",
        text: "text-[#FF6B35]",
        border: "border-[#FF6B35]/40",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        label: "High",
      };

    case "moderate":
      return {
        bg: "bg-yellow-500/15",
        text: "text-yellow-400",
        border: "border-yellow-500/40",
        icon: <AlertTriangle className="w-3 h-3 mr-1" />,
        label: "Moderate",
      };

    case "low":
    default:
      return {
        bg: "bg-gray-500/15",
        text: "text-gray-400",
        border: "border-gray-500/30",
        icon: <Shield className="w-3 h-3 mr-1" />,
        label: "Low",
      };
  }
}

export const ClusterSeverityBadge: React.FC<
  ClusterSeverityBadgeProps
> = ({ severityLevel, size = "md" }) => {
  const styles = getSeverityStyles(severityLevel);

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5"
      : size === "lg"
      ? "text-sm px-3 py-1.5"
      : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}`}
    >
      {styles.icon}
      {styles.label}
    </span>
  );
};
