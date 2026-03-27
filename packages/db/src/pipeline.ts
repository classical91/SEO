import {
  Prisma,
  CrawlRunStatus,
  EffortEstimate,
  IssueCategory,
  IssueSeverity,
  RecommendationType
} from "@prisma/client";
import {
  HeuristicRecommendationService,
  OpenAiRecommendationService,
  type AiRecommendationService
} from "@rankforge/ai";
import { HttpCrawlerService, type CrawlerService } from "@rankforge/crawler";
import {
  GooglePageSpeedService,
  GoogleSearchConsoleService,
  MockPageSpeedService,
  MockSearchConsoleService,
  type PageSpeedService,
  type SearchConsoleService
} from "@rankforge/integrations";
import { DeterministicSeoRulesEngine } from "@rankforge/seo";

import { db } from "./client";
import type {
  AiRecommendJobPayload,
  CrawlRunJobPayload,
  GscSyncJobPayload,
  PageSpeedCollectJobPayload
} from "./jobs";

type PipelineServices = {
  crawler?: CrawlerService;
  searchConsole?: SearchConsoleService;
  pageSpeed?: PageSpeedService;
  ai?: AiRecommendationService;
};

function toSeverity(value: "low" | "medium" | "high" | "critical") {
  return value.toUpperCase() as IssueSeverity;
}

function toEffort(value: "low" | "medium" | "high") {
  return value.toUpperCase() as EffortEstimate;
}

function toCategory(value: string) {
  return value.toUpperCase().replace("-", "_") as IssueCategory;
}

function toJsonValue(value: Record<string, unknown> | undefined) {
  return value as Prisma.InputJsonValue | undefined;
}

function getCrawlerService(services?: PipelineServices) {
  return services?.crawler ?? new HttpCrawlerService();
}

function getSearchConsoleService(refreshToken: string | null, services?: PipelineServices) {
  if (services?.searchConsole) {
    return services.searchConsole;
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && refreshToken) {
    return new GoogleSearchConsoleService();
  }

  return new MockSearchConsoleService();
}

function getPageSpeedService(services?: PipelineServices) {
  if (services?.pageSpeed) {
    return services.pageSpeed;
  }

  if (process.env.PAGESPEED_API_KEY) {
    return new GooglePageSpeedService(process.env.PAGESPEED_API_KEY);
  }

  return new MockPageSpeedService();
}

function getAiService(services?: PipelineServices) {
  if (services?.ai) {
    return services.ai;
  }

  if (process.env.AI_FEATURE_ENABLED !== "false" && process.env.OPENAI_API_KEY) {
    return new OpenAiRecommendationService(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL ?? "gpt-5.4");
  }

  return new HeuristicRecommendationService();
}

async function getGoogleRefreshToken(userId: string) {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: "google",
      refresh_token: {
        not: null
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return account?.refresh_token ?? null;
}

export async function processCrawlRun(payload: CrawlRunJobPayload, services?: PipelineServices) {
  const crawlRun = await db.crawlRun.update({
    where: {
      id: payload.crawlRunId
    },
    data: {
      status: CrawlRunStatus.RUNNING,
      startedAt: new Date(),
      errorMessage: null
    },
    include: {
      project: true,
      domain: true
    }
  });

  try {
    const crawler = getCrawlerService(services);
    const crawlerResult = await crawler.crawl({
      startUrl: crawlRun.domain.homepageUrl,
      maxPages: Number(process.env.CRAWL_MAX_PAGES ?? 50),
      userAgent: process.env.CRAWL_USER_AGENT,
      playwrightFallback: true
    });

    const engine = new DeterministicSeoRulesEngine();
    const seoResult = engine.analyze({
      pages: crawlerResult.pages,
      links: crawlerResult.links,
      sitemapUrls: crawlerResult.sitemaps.map((entry) => entry.url)
    });

    await db.$transaction(async (tx) => {
      await tx.crawlIssue.deleteMany({ where: { crawlRunId: payload.crawlRunId } });
      await tx.crawlLink.deleteMany({ where: { crawlRunId: payload.crawlRunId } });
      await tx.crawlPage.deleteMany({ where: { crawlRunId: payload.crawlRunId } });
      await tx.robotsSnapshot.deleteMany({ where: { crawlRunId: payload.crawlRunId } });
      await tx.sitemapUrl.deleteMany({ where: { crawlRunId: payload.crawlRunId } });

      if (crawlerResult.robots) {
        await tx.robotsSnapshot.create({
          data: {
            crawlRunId: payload.crawlRunId,
            domainId: payload.domainId,
            url: crawlerResult.robots.url,
            raw: crawlerResult.robots.raw,
            blockedPaths: crawlerResult.robots.blockedPaths,
            sitemaps: crawlerResult.robots.sitemaps
          }
        });
      }

      if (crawlerResult.sitemaps.length) {
        await tx.sitemapUrl.createMany({
          data: crawlerResult.sitemaps.map((sitemap) => ({
            crawlRunId: payload.crawlRunId,
            domainId: payload.domainId,
            url: sitemap.url,
            source: sitemap.source
          }))
        });
      }

      const pageIdByUrl = new Map<string, string>();

      for (const page of crawlerResult.pages) {
        const created = await tx.crawlPage.create({
          data: {
            crawlRunId: payload.crawlRunId,
            domainId: payload.domainId,
            projectId: payload.projectId,
            url: page.url,
            normalizedUrl: page.normalizedUrl,
            finalUrl: page.finalUrl,
            canonicalUrl: page.canonicalUrl,
            statusCode: page.statusCode,
            redirectChain: page.redirectChain,
            title: page.title,
            metaDescription: page.metaDescription,
            h1: page.h1,
            metaRobots: page.metaRobots,
            xRobotsTag: page.xRobotsTag,
            contentType: page.contentType,
            wordCount: page.wordCount,
            schemaCount: page.schemaCount,
            missingAltCount: page.missingAltCount,
            internalLinkCount: page.internalLinkCount,
            htmlBytes: page.htmlBytes,
            depth: page.depth,
            isIndexableCandidate: page.isIndexableCandidate,
            discoveredFrom: page.discoveredFrom
          }
        });
        pageIdByUrl.set(page.normalizedUrl, created.id);
      }

      if (crawlerResult.links.length) {
        await tx.crawlLink.createMany({
          data: crawlerResult.links.map((link) => ({
            crawlRunId: payload.crawlRunId,
            projectId: payload.projectId,
            fromPageUrl: link.fromUrl,
            toUrl: link.toUrl,
            normalizedToUrl: link.normalizedToUrl,
            anchorText: link.anchorText,
            isInternal: link.isInternal,
            isBroken: link.isBroken
          }))
        });
      }

      if (seoResult.issues.length) {
        await tx.crawlIssue.createMany({
          data: seoResult.issues.map((issue) => ({
            crawlRunId: payload.crawlRunId,
            projectId: payload.projectId,
            domainId: payload.domainId,
            pageId: pageIdByUrl.get(issue.affectedUrl) ?? null,
            ruleKey: issue.ruleKey,
            title: issue.title,
            summary: issue.summary,
            category: toCategory(issue.category),
            severity: toSeverity(issue.severity),
            effort: toEffort(issue.effort),
            impactScore: issue.impactScore,
            affectedUrl: issue.affectedUrl,
            detailsJson: toJsonValue(issue.details)
          }))
        });
      }

      await tx.domain.update({
        where: { id: payload.domainId },
        data: {
          lastCrawledAt: new Date()
        }
      });

      await tx.crawlRun.update({
        where: { id: payload.crawlRunId },
        data: {
          status: CrawlRunStatus.COMPLETED,
          completedAt: new Date(),
          pagesDiscovered: crawlerResult.discoveredUrls.length,
          pagesCrawled: crawlerResult.pages.length,
          totalIssues: seoResult.issues.length,
          score: seoResult.health.score
        }
      });
    });

    return { ok: true };
  } catch (error) {
    await db.crawlRun.update({
      where: { id: payload.crawlRunId },
      data: {
        status: CrawlRunStatus.FAILED,
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown crawl failure"
      }
    });

    throw error;
  }
}

export async function processSearchConsoleSync(payload: GscSyncJobPayload, services?: PipelineServices) {
  const connection = await db.searchConsoleConnection.findUnique({
    where: { id: payload.connectionId }
  });

  if (!connection) {
    throw new Error("Search Console connection not found");
  }

  const refreshToken = await getGoogleRefreshToken(connection.connectedById);
  const service = getSearchConsoleService(refreshToken, services);
  const credentials = {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "mock-client-id",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "mock-client-secret",
    refreshToken: refreshToken ?? "mock-refresh-token"
  };
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 6);
  let metrics;

  try {
    metrics = await service.syncMetrics({
      credentials,
      propertyUrl: connection.propertyUrl,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10)
    });
  } catch (error) {
    await db.searchConsoleConnection.update({
      where: { id: payload.connectionId },
      data: {
        lastSyncError: error instanceof Error ? error.message : "Search Console sync failed."
      }
    });

    throw error;
  }

  await db.$transaction(async (tx) => {
    await tx.searchConsoleMetric.deleteMany({
      where: {
        projectId: payload.projectId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    if (metrics.length) {
      await tx.searchConsoleMetric.createMany({
        data: metrics.map((metric) => ({
          projectId: payload.projectId,
          pageUrl: metric.pageUrl,
          date: new Date(metric.date),
          clicks: metric.clicks,
          impressions: metric.impressions,
          ctr: metric.ctr,
          position: metric.position
        }))
      });
    }

    await tx.searchConsoleConnection.update({
      where: { id: payload.connectionId },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null
      }
    });
  });

  return { ok: true, synced: metrics.length };
}

export async function processPageSpeedCollection(payload: PageSpeedCollectJobPayload, services?: PipelineServices) {
  const service = getPageSpeedService(services);
  const latestCrawlPages = await db.crawlPage.findMany({
    where: {
      projectId: payload.projectId
    },
    orderBy: [
      { crawlRun: { createdAt: "desc" } },
      { depth: "asc" }
    ],
    take: 5
  });

  const pageUrls = payload.pageUrls?.length
    ? payload.pageUrls
    : latestCrawlPages.map((page) => page.canonicalUrl ?? page.normalizedUrl);

  const snapshots = await Promise.all(
    Array.from(new Set(pageUrls)).map((pageUrl) =>
      service.analyze({
        pageUrl,
        strategy: "mobile"
      })
    )
  );

  if (snapshots.length) {
    await db.pageSpeedSnapshot.createMany({
      data: snapshots.map((snapshot) => ({
        projectId: payload.projectId,
        pageUrl: snapshot.pageUrl,
        strategy: snapshot.strategy,
        performanceScore: snapshot.performanceScore,
        seoScore: snapshot.seoScore,
        accessibilityScore: snapshot.accessibilityScore,
        bestPracticesScore: snapshot.bestPracticesScore,
        lcpMs: snapshot.lcpMs,
        inpMs: snapshot.inpMs,
        cls: snapshot.cls,
        rawPayload: toJsonValue(snapshot.rawPayload),
        capturedAt: new Date(snapshot.capturedAt)
      }))
    });
  }

  return { ok: true, collected: snapshots.length };
}

export async function processAiRecommendations(payload: AiRecommendJobPayload, services?: PipelineServices) {
  const aiService = getAiService(services);
  const project = await db.project.findUnique({
    where: { id: payload.projectId },
    include: {
      domains: true,
      crawlRuns: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    }
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const crawlRunId = payload.crawlRunId ?? project.crawlRuns[0]?.id;

  if (!crawlRunId) {
    throw new Error("No crawl run available for AI recommendations");
  }

  const issues = await db.crawlIssue.findMany({
    where: {
      projectId: payload.projectId,
      crawlRunId
    },
    orderBy: {
      impactScore: "desc"
    },
    take: 8
  });

  const recommendations = await aiService.generateProjectRecommendations({
    projectName: project.name,
    domain: project.domains[0]?.hostname ?? "unknown-domain",
    score: project.crawlRuns[0]?.score ?? 0,
    issues: issues.map((issue) => ({
      ruleKey: issue.ruleKey,
      title: issue.title,
      summary: issue.summary,
      severity: issue.severity.toLowerCase() as "low" | "medium" | "high" | "critical",
      affectedUrl: issue.affectedUrl,
      impactScore: issue.impactScore
    }))
  });

  await db.aiRecommendation.deleteMany({
    where: {
      projectId: payload.projectId,
      crawlRunId,
      type: RecommendationType.PROJECT
    }
  });

  if (recommendations.length) {
    await db.aiRecommendation.createMany({
      data: recommendations.map((recommendation) => ({
        projectId: payload.projectId,
        crawlRunId,
        issueId: issues.find((issue) => recommendation.sourceRuleKeys.includes(issue.ruleKey))?.id,
        pageUrl: issues.find((issue) => recommendation.sourceRuleKeys.includes(issue.ruleKey))?.affectedUrl,
        type: RecommendationType.PROJECT,
        title: recommendation.title,
        summary: recommendation.summary,
        rationale: recommendation.rationale,
        actionsJson: recommendation.actions,
        sourceRuleKeys: recommendation.sourceRuleKeys,
        model: recommendation.model
      }))
    });
  }

  return { ok: true, created: recommendations.length };
}
