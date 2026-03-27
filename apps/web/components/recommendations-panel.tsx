import { Sparkles } from "lucide-react";

import { Badge, Panel } from "@rankforge/ui";

export function RecommendationsPanel({
  recommendations
}: {
  recommendations: Array<{
    id: string;
    title: string;
    summary: string;
    rationale: string;
    model: string;
    actionsJson: unknown;
    sourceRuleKeys: string[];
  }>;
}) {
  return (
    <div className="space-y-4">
      {recommendations.length ? (
        recommendations.map((recommendation) => {
          const actions = Array.isArray(recommendation.actionsJson) ? recommendation.actionsJson.map(String) : [];

          return (
            <Panel className="space-y-4" key={recommendation.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{recommendation.title}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{recommendation.summary}</p>
                </div>
                <Badge>{recommendation.model}</Badge>
              </div>
              <p className="text-sm text-[var(--text-primary)]">{recommendation.rationale}</p>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                {actions.map((action) => (
                  <li className="flex gap-2" key={action}>
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          );
        })
      ) : (
        <Panel>
          <p className="text-sm text-[var(--text-secondary)]">
            Generate recommendations after a crawl to get grounded explanations and implementation-ready fixes.
          </p>
        </Panel>
      )}
    </div>
  );
}
