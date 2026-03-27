import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe, Link2, RefreshCcw, ShieldCheck } from "lucide-react";

import { Button, Input, Panel, SectionHeading } from "@rankforge/ui";

import {
  connectSearchConsoleAction,
  disconnectSearchConsoleAction,
  syncSearchConsoleAction
} from "@/actions/project-actions";
import { requireAppUser } from "@/lib/auth";
import { getProjectDashboard, getSearchConsoleConnectionState } from "@/lib/data";

export default async function ProjectSettingsPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const user = await requireAppUser();
  const settingsPath = `/app/${workspaceSlug}/projects/${projectId}/settings`;
  const [dashboard, properties] = await Promise.all([
    getProjectDashboard(user.id, workspaceSlug, projectId),
    getSearchConsoleConnectionState(user.id, settingsPath)
  ]);

  if (!dashboard) {
    redirect(`/app/${workspaceSlug}`);
  }

  const currentConnection = dashboard.project.searchConsoleConnection;
  const selectedPropertyDefault =
    currentConnection?.propertyUrl ?? properties.properties[0]?.siteUrl ?? "";
  const selectedProperty = properties.properties.find((property) => property.siteUrl === currentConnection?.propertyUrl);
  const manualPropertyDefault =
    currentConnection && !selectedProperty ? currentConnection.propertyUrl : "";
  const propertyLabelDefault =
    currentConnection?.propertyLabel ?? selectedPropertyDefault;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Project settings"
        title={`${dashboard.project.name} integrations`}
        description="Connect Google Search Console at the project level and keep the mapped property visible to everyone in the workspace."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="space-y-5">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-[var(--accent)]" />
            <SectionHeading
              title="Search Console property"
              description="Connect the Google account that owns the property, then choose a verified property or paste the exact Search Console URL."
            />
          </div>
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {properties.mode === "ready"
                    ? "Google account connected"
                    : properties.mode === "demo"
                      ? "Demo property mode"
                      : "Google account required"}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">{properties.message}</p>
                {properties.googleAccountEmail ? (
                  <p className="text-xs text-[var(--text-muted)]">Connected Google account: {properties.googleAccountEmail}</p>
                ) : null}
                {!properties.canManageConnection ? (
                  <Link href={properties.signInPath}>
                    <Button className="mt-2" type="button">
                      {properties.mode === "needs_reauthorization" ? "Re-authorize Google" : "Sign in with Google"}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {properties.canManageConnection ? (
            <form action={connectSearchConsoleAction} className="space-y-4">
              <input name="projectId" type="hidden" value={projectId} />
              <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="property-select">
                  Available properties
                </label>
                <select
                  className="h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--panel)] px-4 text-sm text-[var(--text-primary)]"
                  defaultValue={selectedPropertyDefault}
                  id="property-select"
                  name="selectedPropertyUrl"
                >
                  <option value="">Choose a discovered property</option>
                  {properties.properties.map((property) => (
                    <option key={property.siteUrl} value={property.siteUrl}>
                      {property.siteUrl} ({property.permissionLevel})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-muted)]">If Google returns no properties, paste the exact property URL below.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="manual-property-url">
                  Manual property URL
                </label>
                <Input
                  defaultValue={manualPropertyDefault}
                  id="manual-property-url"
                  name="manualPropertyUrl"
                  placeholder="sc-domain:example.com or https://www.example.com/"
                />
                <p className="text-xs text-[var(--text-muted)]">Manual input overrides the selected property when provided.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="property-label">
                  Property label
                </label>
                <Input defaultValue={propertyLabelDefault} id="property-label" name="propertyLabel" placeholder="example.com" />
              </div>
              <Button type="submit">Save Search Console connection</Button>
            </form>
          ) : null}

          {currentConnection ? (
            <div className="space-y-4 rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">{currentConnection.propertyLabel}</p>
                <p className="text-sm text-[var(--text-secondary)]">{currentConnection.propertyUrl}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Permission: {currentConnection.propertyPermissionLevel ?? "manual property"}
                  {currentConnection.connectedBy?.email ? ` | connected by ${currentConnection.connectedBy.email}` : ""}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Last sync: {currentConnection.lastSyncedAt ? new Date(currentConnection.lastSyncedAt).toLocaleString() : "Never"}
                </p>
                {currentConnection.lastSyncError ? (
                  <p className="text-xs font-medium text-rose-700">Last sync error: {currentConnection.lastSyncError}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <form action={syncSearchConsoleAction}>
                  <input name="connectionId" type="hidden" value={currentConnection.id} />
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
                  <Button type="submit" variant="secondary">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Run Search Console sync
                  </Button>
                </form>
                <form action={disconnectSearchConsoleAction}>
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
                  <Button type="submit" variant="ghost">
                    Disconnect property
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
        </Panel>

        <Panel className="space-y-5">
          <div className="flex items-center gap-3">
            <Link2 className="h-5 w-5 text-[var(--accent)]" />
            <SectionHeading
              title="Tracked domain"
              description="Crawls start from the homepage URL and stay on the same hostname by default."
            />
          </div>
          {dashboard.project.domains.map((domain) => (
            <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4" key={domain.id}>
              <p className="text-sm font-medium text-[var(--text-primary)]">{domain.hostname}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{domain.homepageUrl}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Last crawled: {domain.lastCrawledAt ? new Date(domain.lastCrawledAt).toLocaleString() : "Never"}
              </p>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}
