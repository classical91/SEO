import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

type SectionHeadingProps = HTMLAttributes<HTMLDivElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ className, eyebrow, title, description, ...props }: SectionHeadingProps) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">{eyebrow}</p> : null}
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
        {description ? <p className="max-w-2xl text-sm text-[var(--text-secondary)]">{description}</p> : null}
      </div>
    </div>
  );
}
