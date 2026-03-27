import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";
import { requireAppUser } from "@/lib/auth";
import { getNavigationData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await requireAppUser();
  const workspaces = await getNavigationData(user.id);

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      workspaces={workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        projects: workspace.projects.map((project) => ({
          id: project.id,
          name: project.name,
          domains: project.domains.map((domain) => ({ hostname: domain.hostname })),
          crawlRuns: project.crawlRuns.map((run) => ({ status: run.status, score: run.score }))
        }))
      }))}
    >
      {children}
    </AppShell>
  );
}
