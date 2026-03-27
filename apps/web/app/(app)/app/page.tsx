import { redirect } from "next/navigation";

import { Button, Input, Panel, SectionHeading, Textarea } from "@rankforge/ui";

import { createWorkspaceAction } from "@/actions/project-actions";
import { requireAppUser } from "@/lib/auth";
import { getNavigationData } from "@/lib/data";

export default async function AppIndexPage() {
  const user = await requireAppUser();
  const workspaces = await getNavigationData(user.id);

  if (workspaces[0]) {
    redirect(`/app/${workspaces[0].slug}`);
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Getting started"
        title="Create your first workspace"
        description="Workspaces keep projects, domains, members, and connected integrations separated by team."
      />
      <Panel className="max-w-2xl">
        <form action={createWorkspaceAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="workspace-name">
              Workspace name
            </label>
            <Input id="workspace-name" name="name" placeholder="North Star Studio" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="workspace-notes">
              What will this workspace track?
            </label>
            <Textarea id="workspace-notes" placeholder="Example: marketing site, docs, and landing pages for Q2." />
          </div>
          <Button type="submit">Create workspace</Button>
        </form>
      </Panel>
    </div>
  );
}
