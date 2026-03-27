import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecommendationsPanel } from "@/components/recommendations-panel";

describe("RecommendationsPanel", () => {
  it("renders recommendation copy", () => {
    render(
      <RecommendationsPanel
        recommendations={[
          {
            id: "rec_1",
            title: "Repair the pricing funnel path",
            summary: "Fix the broken internal link before changing copy.",
            rationale: "The issue blocks users and crawlers on a conversion path.",
            model: "heuristic-fallback",
            actionsJson: ["Restore the destination.", "Re-run the crawl."],
            sourceRuleKeys: ["broken-internal-link"]
          }
        ]}
      />
    );

    expect(screen.getByText("Repair the pricing funnel path")).toBeInTheDocument();
    expect(screen.getByText("Restore the destination.")).toBeInTheDocument();
  });
});
