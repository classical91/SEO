export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type EffortEstimate = "low" | "medium" | "high";
export type IssueCategory =
  | "indexability"
  | "metadata"
  | "content"
  | "links"
  | "performance"
  | "structured-data";

export type SeoPageInput = {
  url: string;
  normalizedUrl: string;
  canonicalUrl: string | null;
  statusCode: number;
  redirectChain: string[];
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  metaRobots: string | null;
  xRobotsTag: string | null;
  wordCount: number;
  schemaCount: number;
  missingAltCount: number;
  internalLinkCount: number;
  depth: number;
  isIndexableCandidate: boolean;
};

export type SeoLinkInput = {
  fromUrl: string;
  normalizedToUrl: string;
  isInternal: boolean;
  isBroken: boolean;
};

export type SearchPerformanceHint = {
  pageUrl: string;
  clicks: number;
  impressions: number;
};

export type SeoIssue = {
  ruleKey: string;
  title: string;
  summary: string;
  category: IssueCategory;
  severity: IssueSeverity;
  effort: EffortEstimate;
  impactScore: number;
  affectedUrl: string;
  details?: Record<string, unknown>;
};

export type SeoAnalysisInput = {
  pages: SeoPageInput[];
  links: SeoLinkInput[];
  sitemapUrls?: string[];
  performanceHints?: SearchPerformanceHint[];
};

export type ProjectHealthSummary = {
  issueCount: number;
  pagesCrawled: number;
  criticalCount: number;
  score: number;
};

export type SeoAnalysisResult = {
  issues: SeoIssue[];
  health: ProjectHealthSummary;
};
