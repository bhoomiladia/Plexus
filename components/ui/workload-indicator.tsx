import React from "react";
import { cn } from "@/lib/utils";

interface WorkloadIndicatorProps {
  level: "light" | "moderate" | "heavy";
}

export const WorkloadIndicator: React.FC<WorkloadIndicatorProps> = ({ level }) => {
  const colors = {
    light: "bg-green-500/70 text-green-100",
    moderate: "bg-yellow-500/70 text-yellow-100",
    heavy: "bg-red-500/70 text-red-100",
  };

  const labels = {
    light: "Light Workload",
    moderate: "Moderate Workload",
    heavy: "Heavy Workload",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium w-fit animate-fade-in",
        colors[level]
      )}
    >
      <div
        className={cn(
          "w-3 h-3 rounded-full",
          level === "light"
            ? "bg-green-400 animate-pulse"
            : level === "moderate"
            ? "bg-yellow-400 animate-pulse"
            : "bg-red-400 animate-pulse"
        )}
      />
      <span>{labels[level]}</span>
    </div>
  );
};
