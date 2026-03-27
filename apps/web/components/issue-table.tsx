import Link from "next/link";

import { Badge } from "@rankforge/ui";

import { severityTone } from "@/lib/format";

export function IssueTable({
  workspaceSlug,
  projectId,
  issues
}: {
  workspaceSlug: string;
  projectId: string;
  issues: Array<{
    id: string;
    title: string;
    summary: string;
    severity: string;
    impactScore: number;
    affectedUrl: string;
    pageId: string | null;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[var(--border-subtle)]">
      <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left text-sm">
        <thead className="bg-white/70 text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3 font-medium">Issue</th>
            <th className="px-4 py-3 font-medium">Severity</th>
            <th className="px-4 py-3 font-medium">Impact</th>
            <th className="px-4 py-3 font-medium">Page</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] bg-white/65">
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td className="px-4 py-4 align-top">
                <div className="space-y-1">
                  <p className="font-medium text-[var(--text-primary)]">{issue.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)]">{issue.summary}</p>
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <Badge variant={severityTone(issue.severity)}>{issue.severity}</Badge>
              </td>
              <td className="px-4 py-4 align-top text-[var(--text-primary)]">{issue.impactScore}</td>
              <td className="px-4 py-4 align-top">
                {issue.pageId ? (
                  <Link
                    className="text-[var(--accent)] underline-offset-4 hover:underline"
                    href={`/app/${workspaceSlug}/projects/${projectId}/pages/${issue.pageId}`}
                  >
                    {issue.affectedUrl.replace(/^https?:\/\//, "")}
                  </Link>
                ) : (
                  <span className="text-[var(--text-secondary)]">{issue.affectedUrl.replace(/^https?:\/\//, "")}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
