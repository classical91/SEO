export type CrawlPageSnapshot = {
  url: string;
  normalizedUrl: string;
  finalUrl: string;
  canonicalUrl: string | null;
  statusCode: number;
  redirectChain: string[];
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  metaRobots: string | null;
  xRobotsTag: string | null;
  contentType: string | null;
  wordCount: number;
  schemaCount: number;
  missingAltCount: number;
  internalLinkCount: number;
  htmlBytes: number;
  depth: number;
  isIndexableCandidate: boolean;
  discoveredFrom: string | null;
};

export type CrawlLinkSnapshot = {
  fromUrl: string;
  toUrl: string;
  normalizedToUrl: string;
  anchorText: string | null;
  isInternal: boolean;
  isBroken: boolean;
};

export type RobotsSnapshot = {
  url: string;
  raw: string | null;
  blockedPaths: string[];
  sitemaps: string[];
};

export type SitemapSnapshot = {
  url: string;
  source: "robots" | "default" | "sitemap-index";
};

export type CrawlResult = {
  startUrl: string;
  pages: CrawlPageSnapshot[];
  links: CrawlLinkSnapshot[];
  robots: RobotsSnapshot | null;
  sitemaps: SitemapSnapshot[];
  discoveredUrls: string[];
};

export type CrawlRequest = {
  startUrl: string;
  maxPages?: number;
  userAgent?: string;
  playwrightFallback?: boolean;
};

export interface CrawlerService {
  crawl(request: CrawlRequest): Promise<CrawlResult>;
}
