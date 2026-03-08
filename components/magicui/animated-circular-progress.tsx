"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCircularProgressProps {
  max?: number;
  min?: number;
  value: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
}

export function AnimatedCircularProgress({
  max = 100,
  min = 0,
  value,
  gaugePrimaryColor = "#1b4332",
  gaugeSecondaryColor = "#d8f3dc",
  className,
  size = 120,
  strokeWidth = 10,
  showValue = true,
}: AnimatedCircularProgressProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = ((currentValue - min) / (max - min)) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setCurrentValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        fill="none"
        className="size-full"
        strokeWidth={strokeWidth}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth={strokeWidth}
          stroke={gaugeSecondaryColor}
          strokeLinecap="round"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth={strokeWidth}
          strokeDashoffset={circumference - currentPercent * percentPx}
          strokeDasharray={circumference}
          strokeLinecap="round"
          stroke={gaugePrimaryColor}
          className="origin-center -rotate-90 transform transition-all duration-1000 ease-in-out"
        />
      </svg>
      {showValue && (
        <span className="absolute text-2xl font-heading font-bold text-ink-black">
          {Math.round(currentValue)}
        </span>
      )}
    </div>
  );
}
