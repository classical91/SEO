import Link from "next/link";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";

import { Button, Panel } from "@rankforge/ui";

import { isGoogleAuthConfigured } from "@/lib/env";

export default function SignInPage() {
  return (
    <div className="page-gradient flex min-h-screen items-center justify-center px-5 py-10">
      <Panel className="w-full max-w-xl space-y-8 p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">RankForge</p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Open the operator workspace</h1>
          </div>
        </div>
        <p className="text-sm leading-7 text-[var(--text-secondary)]">
          Sign in with Google to connect Search Console and keep project ownership aligned with the account that can access the
          property.
        </p>
        {isGoogleAuthConfigured ? (
          <Link href="/api/auth/signin/google">
            <Button className="w-full justify-between" size="lg">
              Continue with Google
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--panel)] p-5">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">Demo mode enabled</p>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Google OAuth is not configured, so the app will use the seeded demo workspace when you open the app.
            </p>
            <div className="mt-4">
              <Link href="/app">
                <Button className="w-full" size="lg">
                  Open demo workspace
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
