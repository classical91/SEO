import { describe, expect, it } from "vitest";

import { DeterministicSeoRulesEngine } from "./engine";

describe("DeterministicSeoRulesEngine", () => {
  it("flags duplicate titles and missing metadata", () => {
    const engine = new DeterministicSeoRulesEngine();
    const result = engine.analyze({
      pages: [
        {
          url: "https://example.com/",
          normalizedUrl: "https://example.com/",
          canonicalUrl: null,
          statusCode: 200,
          redirectChain: [],
          title: "Pricing",
          metaDescription: null,
          h1: "Home",
          metaRobots: null,
          xRobotsTag: null,
          wordCount: 180,
          schemaCount: 0,
          missingAltCount: 0,
          internalLinkCount: 6,
          depth: 0,
          isIndexableCandidate: true
        },
        {
          url: "https://example.com/pricing",
          normalizedUrl: "https://example.com/pricing",
          canonicalUrl: null,
          statusCode: 200,
          redirectChain: [],
          title: "Pricing",
          metaDescription: "Same description",
          h1: null,
          metaRobots: null,
          xRobotsTag: null,
          wordCount: 100,
          schemaCount: 0,
          missingAltCount: 1,
          internalLinkCount: 1,
          depth: 1,
          isIndexableCandidate: true
        }
      ],
      links: [
        {
          fromUrl: "https://example.com/",
          normalizedToUrl: "https://example.com/pricing",
          isInternal: true,
          isBroken: false
        }
      ],
      sitemapUrls: ["https://example.com/", "https://example.com/pricing"]
    });

    expect(result.issues.some((issue) => issue.ruleKey === "duplicate-title")).toBe(true);
    expect(result.issues.some((issue) => issue.ruleKey === "missing-meta-description")).toBe(true);
    expect(result.health.issueCount).toBeGreaterThan(0);
  });
});
