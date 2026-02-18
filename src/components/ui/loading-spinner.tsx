import * as React from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "./utils";

export interface LoadingSpinnerProps {
  className?: string;
  size?: number;
  color?: string;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className = "",
  size = 40,
  color = "#800000", // UCU maroon
  label = "Loading...",
}) => (
  <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
    <GraduationCap
      className="animate-spin"
      size={size}
      color={color}
      aria-label="Loading"
      data-testid="loading-spinner"
    />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);
