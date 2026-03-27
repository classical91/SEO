import * as React from "react";

import { cn } from "../lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:bg-white",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
