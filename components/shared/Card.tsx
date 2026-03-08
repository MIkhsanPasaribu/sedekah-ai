import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({
  children,
  className,
  hover = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-ghost bg-surface-white shadow-sm",
        hover &&
          "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({
  children,
  className,
}: CardHeaderProps) {
  return (
    <div className={cn("border-b border-ink-ghost px-6 py-4", className)}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className,
}: CardContentProps) {
  return <div className={cn("px-6 py-4", className)}>{children}</div>;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({
  children,
  className,
}: CardFooterProps) {
  return (
    <div className={cn("border-t border-ink-ghost px-6 py-4", className)}>
      {children}
    </div>
  );
}
