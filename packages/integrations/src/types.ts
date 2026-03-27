export type SearchConsoleProperty = {
  siteUrl: string;
  permissionLevel: string;
};

export type SearchConsoleMetricRecord = {
  pageUrl: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type SearchConsoleCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

export interface SearchConsoleService {
  listProperties(credentials: SearchConsoleCredentials): Promise<SearchConsoleProperty[]>;
  syncMetrics(input: {
    credentials: SearchConsoleCredentials;
    propertyUrl: string;
    startDate: string;
    endDate: string;
  }): Promise<SearchConsoleMetricRecord[]>;
}

export type PageSpeedSnapshotRecord = {
  pageUrl: string;
  strategy: "mobile" | "desktop";
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  capturedAt: string;
  rawPayload?: Record<string, unknown>;
};

export interface PageSpeedService {
  analyze(input: {
    pageUrl: string;
    strategy?: "mobile" | "desktop";
  }): Promise<PageSpeedSnapshotRecord>;
}
