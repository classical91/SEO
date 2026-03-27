import {
  GoogleSearchConsoleService,
  MockSearchConsoleService,
  type SearchConsoleProperty
} from "@rankforge/integrations";
import { db } from "@rankforge/db";

import { env, isGoogleAuthConfigured } from "./env";
import {
  buildSearchConsoleSignInPath,
  getSearchConsoleAccessState,
  type SearchConsoleAccessState
} from "./search-console";

export async function getNavigationData(userId: string) {
  return db.workspace.findMany({
    where: {
      memberships: {
        some: {
          userId
        }
      }
    },
    orderBy: {
      name: "asc"
    },
    include: {
      projects: {
        orderBy: {
          createdAt: "asc"
        },
        include: {
          domains: true,
          crawlRuns: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
      }
    }
  });
}

export async function getWorkspaceBySlug(userId: string, slug: string) {
  return db.workspace.findFirst({
    where: {
      slug,
      memberships: {
        some: {
          userId
        }
      }
    },
    include: {
      projects: {
        orderBy: {
          createdAt: "asc"
        },
        include: {
          domains: true,
          crawlRuns: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
      }
    }
  });
}

export async function getProjectDashboard(userId: string, workspaceSlug: string, projectId: string) {
  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      memberships: {
        some: {
          userId
        }
      }
    }
  });

  if (!workspace) {
    return null;
  }

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      workspaceId: workspace.id
    },
    include: {
      domains: true,
      searchConsoleConnection: {
        include: {
          connectedBy: {
            select: {
              email: true,
              name: true
            }
          }
        }
      },
      crawlRuns: {
        orderBy: {
          createdAt: "desc"
        },
        take: 5
      },
      aiRecommendations: {
        orderBy: {
          createdAt: "desc"
        },
        take: 6
      }
    }
  });

  if (!project) {
    return null;
  }

  const latestCrawlRun = project.crawlRuns[0] ?? null;
  const [issues, pages, metrics, pageSpeedSnapshots] = await Promise.all([
    latestCrawlRun
      ? db.crawlIssue.findMany({
          where: {
            projectId,
            crawlRunId: latestCrawlRun.id
          },
          orderBy: [{ severity: "desc" }, { impactScore: "desc" }],
          take: 50
        })
      : [],
    latestCrawlRun
      ? db.crawlPage.findMany({
          where: {
            projectId,
            crawlRunId: latestCrawlRun.id
          },
          orderBy: [{ depth: "asc" }, { internalLinkCount: "desc" }],
          take: 25
        })
      : [],
    db.searchConsoleMetric.findMany({
      where: {
        projectId
      },
      orderBy: {
        date: "asc"
      },
      take: 30
    }),
    db.pageSpeedSnapshot.findMany({
      where: {
        projectId
      },
      orderBy: {
        capturedAt: "desc"
      },
      take: 10
    })
  ]);

  const issueCounts = issues.reduce(
    (accumulator, issue) => {
      accumulator[issue.severity.toLowerCase()] = (accumulator[issue.severity.toLowerCase()] ?? 0) + 1;
      return accumulator;
    },
    {} as Record<string, number>
  );

  const issuesByCategory = Object.entries(
    issues.reduce(
      (accumulator, issue) => {
        const key = issue.category.toLowerCase().replace(/_/g, " ");
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {} as Record<string, number>
    )
  ).map(([category, count]) => ({ category, count }));

  const metricsByDate = Object.values(
    metrics.reduce(
      (accumulator, metric) => {
        const key = metric.date.toISOString().slice(0, 10);
        const entry = accumulator[key] ?? { date: key, clicks: 0, impressions: 0 };
        entry.clicks += metric.clicks;
        entry.impressions += metric.impressions;
        accumulator[key] = entry;
        return accumulator;
      },
      {} as Record<string, { date: string; clicks: number; impressions: number }>
    )
  );

  const performanceMap = new Map<string, { clicks: number; impressions: number; position: number; ctr: number; pageUrl: string }>();

  for (const metric of metrics) {
    const current = performanceMap.get(metric.pageUrl) ?? {
      clicks: 0,
      impressions: 0,
      position: 0,
      ctr: 0,
      pageUrl: metric.pageUrl
    };
    current.clicks += metric.clicks;
    current.impressions += metric.impressions;
    current.position = metric.position;
    current.ctr = metric.ctr;
    performanceMap.set(metric.pageUrl, current);
  }

  const pageSpeedMap = new Map(
    pageSpeedSnapshots.map((snapshot) => [snapshot.pageUrl, snapshot])
  );

  const pageRows = pages.map((page) => ({
    ...page,
    performance: performanceMap.get(page.canonicalUrl ?? page.normalizedUrl) ?? performanceMap.get(page.normalizedUrl) ?? null,
    pageSpeed: pageSpeedMap.get(page.canonicalUrl ?? page.normalizedUrl) ?? pageSpeedMap.get(page.normalizedUrl) ?? null,
    issues: issues.filter((issue) => issue.pageId === page.id).length
  }));

  return {
    workspace,
    project,
    latestCrawlRun,
    issues,
    issueCounts,
    issuesByCategory,
    metricsByDate,
    pageRows,
    pageSpeedSnapshots,
    searchMetrics: metrics
  };
}

export async function getPageDetail(userId: string, workspaceSlug: string, projectId: string, pageId: string) {
  const dashboard = await getProjectDashboard(userId, workspaceSlug, projectId);

  if (!dashboard) {
    return null;
  }

  const page = dashboard.pageRows.find((entry) => entry.id === pageId);

  if (!page) {
    return null;
  }

  const issues = dashboard.issues.filter((issue) => issue.pageId === page.id || issue.affectedUrl === page.normalizedUrl);
  const inboundLinks = await db.crawlLink.count({
    where: {
      projectId,
      normalizedToUrl: page.normalizedUrl
    }
  });
  const outboundLinks = await db.crawlLink.findMany({
    where: {
      projectId,
      fromPageUrl: page.normalizedUrl
    },
    take: 20
  });

  return {
    ...dashboard,
    page,
    pageIssues: issues,
    inboundLinks,
    outboundLinks
  };
}

export async function getSearchConsoleConnectionState(
  userId: string,
  callbackPath: string
): Promise<SearchConsoleAccessState> {
  const account = await db.account.findFirst({
    where: {
      userId,
      provider: "google"
    },
    orderBy: {
      updatedAt: "desc"
    },
    include: {
      user: {
        select: {
          email: true
        }
      }
    }
  });

  const signInPath = buildSearchConsoleSignInPath(callbackPath);

  if (!isGoogleAuthConfigured) {
    const properties = await new MockSearchConsoleService().listProperties({
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
      refreshToken: "mock-refresh-token"
    });

    return getSearchConsoleAccessState({
      isGoogleAuthConfigured,
      account: null,
      properties,
      signInPath
    });
  }

  let properties: SearchConsoleProperty[] = [];
  let error: string | null = null;

  if (account?.refresh_token) {
    try {
      properties = await new GoogleSearchConsoleService().listProperties({
        clientId: env.GOOGLE_CLIENT_ID!,
        clientSecret: env.GOOGLE_CLIENT_SECRET!,
        refreshToken: account.refresh_token
      });
    } catch (cause) {
      error = cause instanceof Error ? cause.message : "Unable to load Search Console properties from Google.";
    }
  }

  return getSearchConsoleAccessState({
    isGoogleAuthConfigured,
    account: account
      ? {
          email: account.user.email,
          refreshToken: account.refresh_token,
          scope: account.scope
        }
      : null,
    properties,
    signInPath,
    error
  });
}
