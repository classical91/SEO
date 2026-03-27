import type {
  IssueSeverity,
  SearchPerformanceHint,
  SeoAnalysisInput,
  SeoAnalysisResult,
  SeoIssue,
  SeoPageInput
} from "./types";

const severityWeights: Record<IssueSeverity, number> = {
  low: 8,
  medium: 18,
  high: 32,
  critical: 48
};

function getTrafficWeight(performance: SearchPerformanceHint | undefined) {
  if (!performance) {
    return 1;
  }

  return 1 + Math.min((performance.clicks + performance.impressions * 0.05) / 100, 1.5);
}

function scoreIssue(severity: IssueSeverity, page: SeoPageInput, performance?: SearchPerformanceHint) {
  const depthFactor = page.depth <= 1 ? 1.15 : page.depth <= 3 ? 1 : 0.9;
  const internalLinkFactor = page.internalLinkCount >= 10 ? 1.15 : page.internalLinkCount >= 3 ? 1 : 0.9;
  const indexabilityFactor = page.isIndexableCandidate ? 1.1 : 0.85;

  return Math.round(severityWeights[severity] * depthFactor * internalLinkFactor * indexabilityFactor * getTrafficWeight(performance));
}

function makeIssue(
  page: SeoPageInput,
  performance: SearchPerformanceHint | undefined,
  issue: Omit<SeoIssue, "affectedUrl" | "impactScore">
): SeoIssue {
  return {
    ...issue,
    affectedUrl: page.normalizedUrl,
    impactScore: scoreIssue(issue.severity, page, performance)
  };
}

export class DeterministicSeoRulesEngine {
  analyze(input: SeoAnalysisInput): SeoAnalysisResult {
    const issues: SeoIssue[] = [];
    const inboundLinks = new Map<string, number>();
    const titleMap = new Map<string, SeoPageInput[]>();
    const metaMap = new Map<string, SeoPageInput[]>();
    const performanceMap = new Map(input.performanceHints?.map((metric) => [metric.pageUrl, metric]) ?? []);

    for (const link of input.links) {
      if (!link.isInternal) {
        continue;
      }

      inboundLinks.set(link.normalizedToUrl, (inboundLinks.get(link.normalizedToUrl) ?? 0) + 1);
    }

    for (const page of input.pages) {
      if (page.title) {
        titleMap.set(page.title, [...(titleMap.get(page.title) ?? []), page]);
      }

      if (page.metaDescription) {
        metaMap.set(page.metaDescription, [...(metaMap.get(page.metaDescription) ?? []), page]);
      }
    }

    for (const page of input.pages) {
      const performance = performanceMap.get(page.normalizedUrl);

      if (page.statusCode >= 500) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "server-error",
            title: "Server error page",
            summary: "The page returned a 5xx response during the crawl.",
            category: "indexability",
            severity: "critical",
            effort: "medium"
          })
        );
      } else if (page.statusCode >= 400) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "broken-page",
            title: "Broken page",
            summary: "The page returned a 4xx response and cannot be indexed or served reliably.",
            category: "indexability",
            severity: "high",
            effort: "medium"
          })
        );
      }

      if (page.redirectChain.length >= 2) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "redirect-chain",
            title: "Redirect chain detected",
            summary: "The page takes multiple redirects before reaching the final URL.",
            category: "links",
            severity: "high",
            effort: "medium",
            details: {
              redirectChain: page.redirectChain
            }
          })
        );
      }

      if (!page.title) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "missing-title",
            title: "Missing title tag",
            summary: "Search engines and users are not getting a descriptive page title.",
            category: "metadata",
            severity: "high",
            effort: "low"
          })
        );
      }

      if (!page.metaDescription) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "missing-meta-description",
            title: "Missing meta description",
            summary: "The page is missing a meta description for search result snippets.",
            category: "metadata",
            severity: "medium",
            effort: "low"
          })
        );
      }

      if (!page.h1) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "missing-h1",
            title: "Missing H1",
            summary: "The primary on-page heading is missing.",
            category: "content",
            severity: "medium",
            effort: "low"
          })
        );
      }

      if (!page.isIndexableCandidate) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "not-indexable",
            title: "Page is not indexable",
            summary: "Robots directives or response behavior suggest the page should not be indexed.",
            category: "indexability",
            severity: "high",
            effort: "medium",
            details: {
              metaRobots: page.metaRobots,
              xRobotsTag: page.xRobotsTag
            }
          })
        );
      }

      if (page.canonicalUrl && page.canonicalUrl !== page.normalizedUrl) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "cross-canonical",
            title: "Canonical points elsewhere",
            summary: "The canonical URL points to a different page.",
            category: "indexability",
            severity: "medium",
            effort: "low",
            details: {
              canonicalUrl: page.canonicalUrl
            }
          })
        );
      }

      if (page.wordCount > 0 && page.wordCount < 200) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "thin-content",
            title: "Thin content heuristic",
            summary: "The page has very little body copy compared to a typical landing page.",
            category: "content",
            severity: "medium",
            effort: "medium",
            details: {
              wordCount: page.wordCount
            }
          })
        );
      }

      if (page.schemaCount === 0) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "missing-schema",
            title: "No structured data detected",
            summary: "The crawler did not find JSON-LD schema markup on this page.",
            category: "structured-data",
            severity: "low",
            effort: "medium"
          })
        );
      }

      if (page.missingAltCount > 0) {
        issues.push(
          makeIssue(page, performance, {
            ruleKey: "missing-alt-text",
            title: "Images missing alt text",
            summary: "One or more images do not have alt text.",
            category: "content",
            severity: "medium",
            effort: "low",
            details: {
              missingAltCount: page.missingAltCount
            }
          })
        );
      }

      const inboundCount = inboundLinks.get(page.normalizedUrl) ?? 0;

      if (page.statusCode < 400 && inboundCount === 0) {
        const isSitemapReferenced = input.sitemapUrls?.includes(page.normalizedUrl);
        issues.push(
          makeIssue(page, performance, {
            ruleKey: isSitemapReferenced ? "orphan-page" : "isolated-page",
            title: isSitemapReferenced ? "Potential orphan page" : "Page has no internal links",
            summary: isSitemapReferenced
              ? "The page appears in sitemap sources but has no internal links pointing to it."
              : "The page has no discovered inbound internal links.",
            category: "links",
            severity: "medium",
            effort: "medium"
          })
        );
      }
    }

    for (const [title, pages] of titleMap.entries()) {
      if (pages.length < 2) {
        continue;
      }

      for (const page of pages) {
        issues.push(
          makeIssue(page, performanceMap.get(page.normalizedUrl), {
            ruleKey: "duplicate-title",
            title: "Duplicate title tag",
            summary: `The title tag is duplicated across ${pages.length} pages.`,
            category: "metadata",
            severity: "medium",
            effort: "low",
            details: {
              title,
              duplicateCount: pages.length
            }
          })
        );
      }
    }

    for (const [description, pages] of metaMap.entries()) {
      if (pages.length < 2) {
        continue;
      }

      for (const page of pages) {
        issues.push(
          makeIssue(page, performanceMap.get(page.normalizedUrl), {
            ruleKey: "duplicate-meta-description",
            title: "Duplicate meta description",
            summary: `The meta description is duplicated across ${pages.length} pages.`,
            category: "metadata",
            severity: "low",
            effort: "low",
            details: {
              description,
              duplicateCount: pages.length
            }
          })
        );
      }
    }

    for (const link of input.links.filter((entry) => entry.isInternal && entry.isBroken)) {
      const page = input.pages.find((candidate) => candidate.normalizedUrl === link.fromUrl);

      if (!page) {
        continue;
      }

      issues.push(
        makeIssue(page, performanceMap.get(page.normalizedUrl), {
          ruleKey: "broken-internal-link",
          title: "Broken internal link",
          summary: "An internal link points to a page that returned an error.",
          category: "links",
          severity: "high",
          effort: "low",
          details: {
            targetUrl: link.normalizedToUrl
          }
        })
      );
    }

    const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
    const scorePenalty = issues.reduce((total, issue) => total + severityWeights[issue.severity] / 2, 0);
    const score = Math.max(0, 100 - Math.round(scorePenalty / Math.max(input.pages.length || 1, 1)));

    return {
      issues,
      health: {
        issueCount: issues.length,
        pagesCrawled: input.pages.length,
        criticalCount,
        score
      }
    };
  }
}
