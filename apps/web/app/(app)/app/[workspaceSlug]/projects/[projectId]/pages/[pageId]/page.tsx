import { redirect } from "next/navigation";
import { ArrowUpRight, Gauge, Link2, SearchCheck } from "lucide-react";

import { Badge, Panel, SectionHeading } from "@rankforge/ui";

import { IssueTable } from "@/components/issue-table";
import { requireAppUser } from "@/lib/auth";
import { formatPercent, severityTone } from "@/lib/format";
import { getPageDetail } from "@/lib/data";

export default async function PageDetailPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; projectId: string; pageId: string }>;
}) {
  const { workspaceSlug, projectId, pageId } = await params;
  const user = await requireAppUser();
  const detail = await getPageDetail(user.id, workspaceSlug, projectId, pageId);

  if (!detail) {
    redirect(`/app/${workspaceSlug}/projects/${projectId}`);
  }

  const snapshot = detail.page.pageSpeed;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Page detail"
        title={detail.page.title ?? detail.page.normalizedUrl}
        description={detail.page.normalizedUrl}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Status code", value: detail.page.statusCode, icon: SearchCheck },
          { label: "Word count", value: detail.page.wordCount, icon: ArrowUpRight },
          { label: "Inbound links", value: detail.inboundLinks, icon: Link2 },
          { label: "PSI mobile", value: snapshot?.performanceScore ?? "--", icon: Gauge }
        ].map((metric) => (
          <Panel className="space-y-3" key={metric.label}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{metric.label}</p>
              <metric.icon className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{metric.value}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="space-y-5">
          <SectionHeading
            eyebrow="Issues"
            title="Page-specific findings"
            description="These issues are scoped to the selected URL based on the latest crawl run."
          />
          <IssueTable issues={detail.pageIssues} projectId={projectId} workspaceSlug={workspaceSlug} />
        </Panel>

        <div className="space-y-6">
          <Panel className="space-y-5">
            <SectionHeading
              eyebrow="Search performance"
              title="Page metrics"
              description="Search Console totals and latest PageSpeed snapshot for this URL."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
                <p className="text-xs text-[var(--text-muted)]">Clicks</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{detail.page.performance?.clicks ?? "--"}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
                <p className="text-xs text-[var(--text-muted)]">CTR</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {detail.page.performance ? formatPercent(detail.page.performance.ctr) : "--"}
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
                <p className="text-xs text-[var(--text-muted)]">SEO score</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{snapshot?.seoScore ?? "--"}</p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-white/70 p-4">
                <p className="text-xs text-[var(--text-muted)]">LCP</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                  {snapshot?.lcpMs ? `${Math.round(snapshot.lcpMs)} ms` : "--"}
                </p>
              </div>
            </div>
          </Panel>

          <Panel className="space-y-4">
            <SectionHeading
              eyebrow="Link context"
              title="Outbound links"
              description="The latest crawl discovered these links on the selected page."
            />
            <div className="space-y-3">
              {detail.outboundLinks.length ? (
                detail.outboundLinks.map((link) => (
                  <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border-subtle)] bg-white/70 p-4" key={link.id}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{link.normalizedToUrl.replace(/^https?:\/\//, "")}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{link.anchorText ?? "No anchor text captured"}</p>
                    </div>
                    <Badge variant={link.isBroken ? severityTone("high") : "success"}>{link.isBroken ? "Broken" : "Live"}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No outbound links were recorded for this page.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
