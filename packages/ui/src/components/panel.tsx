import type { HTMLAttributes } from "react";

import { cn } from "../lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--panel)_88%,white)] p-5 shadow-[0_20px_50px_rgba(10,21,41,0.06)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
