import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BarChart3, Bot, Gauge, Plus, RefreshCcw, SearchCheck } from "lucide-react";

import { Badge, Button, Input, Panel, SectionHeading } from "@rankforge/ui";

import {
  addDomainAction,
  generateRecommendationsAction,
  refreshPageSpeedAction,
  startCrawlAction,
  syncSearchConsoleAction
} from "@/actions/project-actions";
import { IssueCategoryChart } from "@/components/charts/issue-category-chart";
import { PerformanceTrend } from "@/components/charts/performance-trend";
import { IssueTable } from "@/components/issue-table";
import { PageTable } from "@/components/page-table";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { requireAppUser } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getProjectDashboard } from "@/lib/data";

export default async function ProjectDashboardPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; projectId: string }>;
}) {
  const { workspaceSlug, projectId } = await params;
  const user = await requireAppUser();
  const dashboard = await getProjectDashboard(user.id, workspaceSlug, projectId);

  if (!dashboard) {
    redirect(`/app/${workspaceSlug}`);
  }

  const domain = dashboard.project.domains[0] ?? null;
  const totalClicks = dashboard.searchMetrics.reduce((total, metric) => total + metric.clicks, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          eyebrow="Project dashboard"
          title={dashboard.project.name}
          description={
            domain
              ? `Monitoring ${domain.hostname} across crawl health, search performance, page speed, and AI fix recommendations.`
              : "Add a domain first, then run the first crawl to populate the project."
          }
        />
        <div className="flex flex-wrap gap-3">
          <Link href={`/app/${workspaceSlug}/projects/${projectId}/settings`}>
            <Button variant="secondary">Project settings</Button>
          </Link>
          {domain ? (
            <form action={startCrawlAction}>
              <input name="projectId" type="hidden" value={projectId} />
              <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
              <input name="domainId" type="hidden" value={domain.id} />
              <Button className="gap-2" type="submit">
                <SearchCheck className="h-4 w-4" />
                Run crawl
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {!domain ? (
        <Panel className="max-w-2xl space-y-5">
          <SectionHeading
            eyebrow="Domain onboarding"
            title="Connect the first domain"
            description="Use the canonical homepage URL you want the crawler to start from."
          />
          <form action={addDomainAction} className="flex flex-col gap-3 sm:flex-row">
            <input name="projectId" type="hidden" value={projectId} />
            <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
            <Input className="flex-1" name="homepageUrl" placeholder="https://rankforge.dev/" required />
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add domain
            </Button>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Health score",
            value: dashboard.latestCrawlRun?.score ?? "--",
            icon: Gauge
          },
          {
            label: "Pages crawled",
            value: dashboard.latestCrawlRun?.pagesCrawled ?? 0,
            icon: SearchCheck
          },
          {
            label: "Tracked issues",
            value: dashboard.latestCrawlRun?.totalIssues ?? 0,
            icon: BarChart3
          },
          {
            label: "Organic clicks",
            value: totalClicks,
            icon: ArrowRight
          }
        ].map((metric) => (
          <Panel className="space-y-3" key={metric.label}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{metric.label}</p>
              <metric.icon className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">{formatNumber(Number(metric.value) || 0)}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <SectionHeading
              eyebrow="Search trend"
              title="Clicks and impressions"
              description="Search Console metrics are grouped by day across all tracked pages."
            />
            <div className="flex flex-wrap gap-2">
              {dashboard.project.searchConsoleConnection ? (
                <form action={syncSearchConsoleAction}>
                  <input name="connectionId" type="hidden" value={dashboard.project.searchConsoleConnection.id} />
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
                  <Button size="sm" type="submit" variant="secondary">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync GSC
                  </Button>
                </form>
              ) : (
                <Link href={`/app/${workspaceSlug}/projects/${projectId}/settings`}>
                  <Button size="sm" variant="secondary">
                    Connect GSC
                  </Button>
                </Link>
              )}
              <form action={refreshPageSpeedAction}>
                <input name="projectId" type="hidden" value={projectId} />
                <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
                <Button size="sm" type="submit" variant="secondary">
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh PSI
                </Button>
              </form>
            </div>
          </div>
          <PerformanceTrend data={dashboard.metricsByDate} />
        </Panel>

        <Panel className="space-y-5">
          <SectionHeading
            eyebrow="Issue mix"
            title="Issues by category"
            description="Metadata and content problems show up fastest in the seeded project, but the chart updates from real crawl findings."
          />
          <IssueCategoryChart data={dashboard.issuesByCategory} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Panel className="space-y-5">
            <div className="flex items-center justify-between">
              <SectionHeading
                eyebrow="Issues"
                title="Prioritized crawl findings"
                description="Severity is deterministic. AI can explain and suggest fixes, but it does not set the base score."
              />
              <div className="flex gap-2">
                {Object.entries(dashboard.issueCounts).map(([severity, count]) => (
                  <Badge key={severity}>{severity}: {count}</Badge>
                ))}
              </div>
            </div>
            <IssueTable issues={dashboard.issues.slice(0, 12)} projectId={projectId} workspaceSlug={workspaceSlug} />
          </Panel>

          <Panel className="space-y-5">
            <SectionHeading
              eyebrow="Pages"
              title="Page inventory"
              description="Crawl findings, performance data, and page-level issue counts are merged into one table."
            />
            <PageTable pages={dashboard.pageRows.slice(0, 12)} projectId={projectId} workspaceSlug={workspaceSlug} />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeading
                eyebrow="AI layer"
                title="Fix recommendations"
                description="Generate grounded explanations and next actions from the latest crawl run."
              />
              {dashboard.latestCrawlRun ? (
                <form action={generateRecommendationsAction}>
                  <input name="projectId" type="hidden" value={projectId} />
                  <input name="workspaceSlug" type="hidden" value={workspaceSlug} />
                  <input name="crawlRunId" type="hidden" value={dashboard.latestCrawlRun.id} />
                  <Button size="sm" type="submit">
                    <Bot className="mr-2 h-4 w-4" />
                    Generate
                  </Button>
                </form>
              ) : null}
            </div>
            <RecommendationsPanel recommendations={dashboard.project.aiRecommendations} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
