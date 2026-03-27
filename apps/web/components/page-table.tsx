import Link from "next/link";

import { Badge } from "@rankforge/ui";

import { formatPercent, severityTone } from "@/lib/format";

export function PageTable({
  workspaceSlug,
  projectId,
  pages
}: {
  workspaceSlug: string;
  projectId: string;
  pages: Array<{
    id: string;
    normalizedUrl: string;
    title: string | null;
    statusCode: number;
    wordCount: number;
    issues: number;
    performance: { clicks: number; ctr: number } | null;
  }>;
}) {
  return (
    <div className="overflow-hidden rounded-[26px] border border-[var(--border-subtle)]">
      <table className="min-w-full divide-y divide-[var(--border-subtle)] text-left text-sm">
        <thead className="bg-white/70 text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-3 font-medium">Page</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Clicks</th>
            <th className="px-4 py-3 font-medium">CTR</th>
            <th className="px-4 py-3 font-medium">Issues</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] bg-white/65">
          {pages.map((page) => (
            <tr key={page.id}>
              <td className="px-4 py-4 align-top">
                <div className="space-y-1">
                  <Link
                    className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                    href={`/app/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}
                  >
                    {page.title ?? page.normalizedUrl.replace(/^https?:\/\//, "")}
                  </Link>
                  <p className="text-[13px] text-[var(--text-secondary)]">{page.normalizedUrl.replace(/^https?:\/\//, "")}</p>
                </div>
              </td>
              <td className="px-4 py-4 align-top">{page.statusCode}</td>
              <td className="px-4 py-4 align-top">{page.performance?.clicks ?? "--"}</td>
              <td className="px-4 py-4 align-top">{page.performance ? formatPercent(page.performance.ctr) : "--"}</td>
              <td className="px-4 py-4 align-top">
                <Badge variant={page.issues > 3 ? severityTone("high") : severityTone("medium")}>{page.issues}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
