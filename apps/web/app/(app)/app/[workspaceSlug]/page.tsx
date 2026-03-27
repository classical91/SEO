import Link from "next/link";
import { redirect } from "next/navigation";

import { Button, Input, Panel, SectionHeading, Textarea } from "@rankforge/ui";

import { createProjectAction } from "@/actions/project-actions";
import { requireAppUser } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/data";

export default async function WorkspacePage({ params }: { params: Promise<{ workspaceSlug: string }> }) {
  const { workspaceSlug } = await params;
  const user = await requireAppUser();
  const workspace = await getWorkspaceBySlug(user.id, workspaceSlug);

  if (!workspace) {
    redirect("/app");
  }

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Workspace"
        title={workspace.name}
        description="Projects group the domains, crawl runs, integrations, and recommendations you want to operate together."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeading title="Projects" description="Jump into a project dashboard or add a new tracked site." />
          <div className="grid gap-4">
            {workspace.projects.length ? (
              workspace.projects.map((project) => (
                <Panel className="flex items-center justify-between gap-4" key={project.id}>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{project.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {project.domains[0]?.hostname ?? "No domain connected yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">Latest crawl</p>
                      <p className="text-xl font-semibold text-[var(--text-primary)]">{project.crawlRuns[0]?.score ?? "--"}</p>
                    </div>
                    <Link href={`/app/${workspace.slug}/projects/${project.id}`}>
                      <Button variant="secondary">Open</Button>
                    </Link>
                  </div>
                </Panel>
              ))
            ) : (
              <Panel>
                <p className="text-sm text-[var(--text-secondary)]">This workspace is empty. Add a project to start tracking a domain.</p>
              </Panel>
            )}
          </div>
        </div>

        <Panel className="space-y-5">
          <SectionHeading
            eyebrow="New project"
            title="Add a project"
            description="Create a project for one product site, docs site, or client domain group."
          />
          <form action={createProjectAction} className="space-y-4">
            <input name="workspaceId" type="hidden" value={workspace.id} />
            <input name="workspaceSlug" type="hidden" value={workspace.slug} />
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="project-name">
                Project name
              </label>
              <Input id="project-name" name="name" placeholder="RankForge Marketing" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="project-description">
                Description
              </label>
              <Textarea id="project-description" name="description" placeholder="Main marketing site and launch pages." />
            </div>
            <Button type="submit">Create project</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
