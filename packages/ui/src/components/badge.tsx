import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", {
  variants: {
    variant: {
      neutral: "bg-[var(--panel)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-800",
      danger: "bg-rose-100 text-rose-800",
      info: "bg-sky-100 text-sky-700"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
