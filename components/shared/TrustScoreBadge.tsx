import { cn } from "@/lib/utils";
import {
  getTrustScoreColor,
  getTrustScoreBg,
  getTrustScoreLabel,
} from "@/lib/utils";

interface TrustScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function TrustScoreBadge({
  score,
  size = "md",
  showLabel = true,
  className,
}: TrustScoreBadgeProps) {
  const color = getTrustScoreColor(score);
  const bg = getTrustScoreBg(score);
  const label = getTrustScoreLabel(score);

  const sizes = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: bg, color }}
    >
      <span className="font-bold">{score}</span>
      {showLabel && <span className="font-medium">/ 100 — {label}</span>}
    </span>
  );
}

interface TrustScoreBarProps {
  score: number;
  className?: string;
}

export function TrustScoreBar({
  score,
  className,
}: TrustScoreBarProps) {
  const color = getTrustScoreColor(score);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-ink-mid">Trust Score</span>
        <span className="text-xs font-bold" style={{ color }}>
          {score}/100
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-ghost">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
