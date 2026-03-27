import type { PageSpeedService, PageSpeedSnapshotRecord } from "./types";

function toScore(value: unknown) {
  if (typeof value === "number") {
    return Math.round(value * 100);
  }

  return 0;
}

function toNumericMetric(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  return null;
}

export class GooglePageSpeedService implements PageSpeedService {
  constructor(private readonly apiKey: string) {}

  async analyze(input: {
    pageUrl: string;
    strategy?: "mobile" | "desktop";
  }): Promise<PageSpeedSnapshotRecord> {
    const strategy = input.strategy ?? "mobile";
    const requestUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    requestUrl.searchParams.set("url", input.pageUrl);
    requestUrl.searchParams.set("strategy", strategy);
    requestUrl.searchParams.set("category", "performance");
    requestUrl.searchParams.set("category", "seo");
    requestUrl.searchParams.set("category", "accessibility");
    requestUrl.searchParams.set("category", "best-practices");
    requestUrl.searchParams.set("key", this.apiKey);

    const response = await fetch(requestUrl);

    if (!response.ok) {
      throw new Error(`PageSpeed request failed with ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, any>;
    const lighthouse = payload.lighthouseResult ?? {};
    const categories = lighthouse.categories ?? {};
    const audits = lighthouse.audits ?? {};

    return {
      pageUrl: input.pageUrl,
      strategy,
      performanceScore: toScore(categories.performance?.score),
      seoScore: toScore(categories.seo?.score),
      accessibilityScore: toScore(categories.accessibility?.score),
      bestPracticesScore: toScore(categories["best-practices"]?.score),
      lcpMs: toNumericMetric(audits["largest-contentful-paint"]?.numericValue),
      inpMs: toNumericMetric(audits["interaction-to-next-paint"]?.numericValue),
      cls: toNumericMetric(audits["cumulative-layout-shift"]?.numericValue),
      capturedAt: new Date().toISOString(),
      rawPayload: payload
    };
  }
}

export class MockPageSpeedService implements PageSpeedService {
  async analyze(input: {
    pageUrl: string;
    strategy?: "mobile" | "desktop";
  }): Promise<PageSpeedSnapshotRecord> {
    return {
      pageUrl: input.pageUrl,
      strategy: input.strategy ?? "mobile",
      performanceScore: 72,
      seoScore: 88,
      accessibilityScore: 91,
      bestPracticesScore: 83,
      lcpMs: 2600,
      inpMs: 190,
      cls: 0.08,
      capturedAt: new Date().toISOString(),
      rawPayload: {
        source: "mock"
      }
    };
  }
}
