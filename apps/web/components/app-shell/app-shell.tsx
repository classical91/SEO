import type { ReactNode } from "react";

import { SignOutButton } from "@/components/sign-out-button";

import { Sidebar } from "./sidebar";

type AppShellProps = {
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    projects: Array<{
      id: string;
      name: string;
      domains: Array<{ hostname: string }>;
      crawlRuns: Array<{ status: string; score: number | null }>;
    }>;
  }>;
  user: {
    name: string | null;
    email: string | null;
  };
  children: ReactNode;
};

export function AppShell({ workspaces, user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] lg:grid lg:grid-cols-[290px_1fr]">
      <Sidebar workspaces={workspaces} />
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--background)_82%,white)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">Operator view</p>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Technical SEO workspace</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name ?? "RankForge user"}</p>
                <p className="text-xs text-[var(--text-muted)]">{user.email ?? "Demo session"}</p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
