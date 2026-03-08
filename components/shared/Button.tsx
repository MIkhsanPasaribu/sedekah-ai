import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-green-deep text-white hover:bg-brand-green-mid focus:ring-brand-green-light shadow-md hover:shadow-lg",
        secondary:
          "bg-brand-gold-core text-white hover:bg-brand-gold-deep focus:ring-brand-gold-bright shadow-md hover:shadow-lg",
        outline:
          "border-2 border-brand-green-deep text-brand-green-deep hover:bg-brand-green-deep hover:text-white focus:ring-brand-green-light",
        ghost:
          "text-brand-green-deep hover:bg-brand-green-ghost focus:ring-brand-green-light",
        danger: "bg-danger text-white hover:bg-red-700 focus:ring-red-400",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isLoading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

export { buttonVariants };
