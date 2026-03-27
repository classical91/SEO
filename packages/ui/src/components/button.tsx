import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] px-4 py-2 text-[var(--accent-foreground)] shadow-[0_8px_32px_rgba(13,25,44,0.18)] hover:translate-y-[-1px]",
        secondary: "bg-[var(--panel)] px-4 py-2 text-[var(--text-primary)] ring-1 ring-[var(--border-strong)] hover:bg-[var(--panel-strong)]",
        ghost: "px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--panel)] hover:text-[var(--text-primary)]"
      },
      size: {
        default: "",
        sm: "px-3 py-1.5 text-xs",
        lg: "px-5 py-2.5"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));

Button.displayName = "Button";
