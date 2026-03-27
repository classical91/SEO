import Link from "next/link";
import { ArrowRight, Search, Sparkles, Waypoints } from "lucide-react";

import { Badge, Button } from "@rankforge/ui";

export default function MarketingPage() {
  return (
    <div className="page-gradient min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Link className="flex items-center gap-3" href="/">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_18px_34px_rgba(10,65,130,0.22)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">RankForge</p>
            <h1 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">SEO operations</h1>
          </div>
        </Link>
        <Link href="/sign-in">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-16">
        <section className="space-y-8">
          <Badge variant="info">AI-assisted technical audits</Badge>
          <div className="space-y-5">
            <h2 className="max-w-3xl text-5xl font-semibold tracking-[-0.06em] text-[var(--text-primary)] sm:text-6xl">
              Crawl, score, and explain the SEO fixes that actually move a site forward.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              RankForge combines a technical crawler, Search Console visibility, PageSpeed signals, and AI fix guidance in one
              calm operator workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-in">
              <Button className="gap-2" size="lg">
                Open the workspace
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#product">
              <Button size="lg" variant="secondary">
                See the product surface
              </Button>
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Crawl engine", value: "HTTP-first with JS fallback" },
              { label: "Merged signal", value: "Technical + GSC + PSI" },
              { label: "AI output", value: "Explainers and fix suggestions" }
            ].map((item) => (
              <div className="rounded-[26px] border border-[var(--border-subtle)] bg-white/68 p-4" key={item.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.label}</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[36px] border border-[var(--border-subtle)] bg-[rgba(255,255,255,0.74)] p-6 shadow-[0_26px_70px_rgba(13,25,44,0.12)] backdrop-blur" id="product">
          <div className="grid gap-4">
            <div className="rounded-[28px] bg-[var(--panel)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Health score</p>
                  <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">76</p>
                </div>
                <Badge variant="warning">5 issues to fix</Badge>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Broken links", value: "1 high impact" },
                  { label: "Duplicate metadata", value: "2 pages" },
                  { label: "Thin content", value: "Pricing page" },
                  { label: "PageSpeed", value: "61 mobile" }
                ].map((metric) => (
                  <div className="rounded-[22px] border border-[var(--border-subtle)] bg-white/80 p-4" key={metric.label}>
                    <p className="text-xs text-[var(--text-muted)]">{metric.label}</p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{metric.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Crawler",
                  body: "Robots, canonicals, status codes, metadata, alt text, duplicate detection."
                },
                {
                  icon: Waypoints,
                  title: "Performance",
                  body: "Search Console and PageSpeed mapped back to the affected pages."
                },
                {
                  icon: Sparkles,
                  title: "AI guidance",
                  body: "Plain-language issue explanations and implementation-ready fixes."
                }
              ].map((feature) => (
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/72 p-4" key={feature.title}>
                  <feature.icon className="h-5 w-5 text-[var(--accent)]" />
                  <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
