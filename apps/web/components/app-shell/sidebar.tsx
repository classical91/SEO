"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, Globe, Sparkles } from "lucide-react";

import { Badge, cn } from "@rankforge/ui";

type NavigationWorkspace = {
  id: string;
  name: string;
  slug: string;
  projects: Array<{
    id: string;
    name: string;
    domains: Array<{ hostname: string }>;
    crawlRuns: Array<{ status: string; score: number | null }>;
  }>;
};

export function Sidebar({ workspaces }: { workspaces: NavigationWorkspace[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-[290px] flex-col border-r border-[var(--border-subtle)] bg-[var(--sidebar)] px-5 py-6 lg:flex">
      <Link className="flex items-center gap-3" href="/">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-foreground)] shadow-[0_14px_28px_rgba(10,65,130,0.22)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">RankForge</p>
          <h1 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">SEO operations</h1>
        </div>
      </Link>

      <div className="mt-8 space-y-6">
        {workspaces.map((workspace) => (
          <div className="space-y-3" key={workspace.id}>
            <div className="flex items-center justify-between">
              <Link className="text-sm font-semibold text-[var(--text-primary)]" href={`/app/${workspace.slug}`}>
                {workspace.name}
              </Link>
              <Badge>{workspace.projects.length} projects</Badge>
            </div>
            <div className="space-y-2">
              {workspace.projects.map((project) => {
                const href = `/app/${workspace.slug}/projects/${project.id}`;
                const active = pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <Link
                    className={cn(
                      "block rounded-[22px] border px-4 py-3 transition",
                      active
                        ? "border-[var(--border-strong)] bg-white text-[var(--text-primary)] shadow-[0_14px_28px_rgba(10,21,41,0.08)]"
                        : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-subtle)] hover:bg-white/70"
                    )}
                    href={href}
                    key={project.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="mt-0.5 h-4 w-4" />
                          <span className="text-sm font-medium">{project.name}</span>
                        </div>
                        <p className="line-clamp-1 text-xs text-[var(--text-muted)]">
                          {project.domains[0]?.hostname ?? "Add a domain to begin crawling"}
                        </p>
                      </div>
                      <Badge variant={project.crawlRuns[0]?.status === "COMPLETED" ? "success" : "neutral"}>
                        {project.crawlRuns[0]?.score ?? "--"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-[28px] border border-[var(--border-subtle)] bg-white/80 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <Globe className="h-4 w-4 text-[var(--accent)]" />
          HTTP-first crawler
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Inline mode is enabled when Redis is unavailable, so local runs still move the crawl pipeline end to end.
        </p>
      </div>
    </aside>
  );
}
