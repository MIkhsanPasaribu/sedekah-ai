"use client";

import { cn } from "@/lib/utils";
import {
  Calculator,
  Shield,
  BarChart3,
  Bot,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  Shield,
  BarChart3,
  Bot,
};

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  name: string;
  className?: string;
  background?: React.ReactNode;
  iconName: string;
  description: string;
  href?: string;
  cta?: string;
}

export function BentoCard({
  name,
  className,
  background,
  iconName,
  description,
  href,
  cta,
}: BentoCardProps) {
  const Icon = ICON_MAP[iconName] ?? Calculator;
  return (
    <div
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
        "bg-surface-white border border-ink-ghost/50 shadow-sm",
        "transform-gpu transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className,
      )}
    >
      <div>{background}</div>
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-2">
        <Icon className="h-12 w-12 origin-left transform-gpu text-brand-green-deep transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="text-xl font-heading font-semibold text-ink-black">
          {name}
        </h3>
        <p className="max-w-lg text-ink-mid">{description}</p>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        {href && cta && (
          <a
            href={href}
            className="pointer-events-auto inline-flex items-center gap-1 text-sm font-medium text-brand-green-deep hover:text-brand-green-mid"
          >
            {cta} →
          </a>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-brand-green-ghost/20" />
    </div>
  );
}
