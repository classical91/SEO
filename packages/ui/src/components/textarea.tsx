import * as React from "react";

import { cn } from "../lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--border-strong)] focus:bg-white",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
