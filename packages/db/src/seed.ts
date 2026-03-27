import { CrawlRunStatus, EffortEstimate, IssueCategory, IssueSeverity, RecommendationType } from "@prisma/client";

import { db } from "./client";

async function main() {
  const email = "demo@rankforge.local";

  const user = await db.user.upsert({
    where: { email },
    update: {
      name: "RankForge Demo"
    },
    create: {
      email,
      name: "RankForge Demo"
    }
  });

  const workspace = await db.workspace.upsert({
    where: { slug: "north-star" },
    update: {
      ownerId: user.id,
      name: "North Star Studio"
    },
    create: {
      name: "North Star Studio",
      slug: "north-star",
      ownerId: user.id
    }
  });

  await db.membership.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    },
    update: {
      role: "OWNER"
    },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER"
    }
  });

  const project = await db.project.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: "rankforge-site"
      }
    },
    update: {
      name: "RankForge Marketing"
    },
    create: {
      workspaceId: workspace.id,
      name: "RankForge Marketing",
      slug: "rankforge-site",
      description: "Demo project seeded for local development."
    }
  });

  const domain = await db.domain.upsert({
    where: {
      projectId_hostname: {
        projectId: project.id,
        hostname: "rankforge.dev"
      }
    },
    update: {
      homepageUrl: "https://rankforge.dev/"
    },
    create: {
      projectId: project.id,
      hostname: "rankforge.dev",
      homepageUrl: "https://rankforge.dev/"
    }
  });

  await db.aiRecommendation.deleteMany({
    where: {
      projectId: project.id
    }
  });
  await db.pageSpeedSnapshot.deleteMany({
    where: {
      projectId: project.id
    }
  });
  await db.searchConsoleMetric.deleteMany({
    where: {
      projectId: project.id
    }
  });
  await db.crawlRun.deleteMany({
    where: {
      projectId: project.id
    }
  });

  const crawlRun = await db.crawlRun.create({
    data: {
      projectId: project.id,
      domainId: domain.id,
      triggeredById: user.id,
      status: CrawlRunStatus.COMPLETED,
      startedAt: new Date(Date.now() - 1000 * 60 * 18),
      completedAt: new Date(Date.now() - 1000 * 60 * 12),
      pagesDiscovered: 4,
      pagesCrawled: 4,
      totalIssues: 5,
      score: 76
    }
  });

  const homePage = await db.crawlPage.create({
    data: {
      projectId: project.id,
      domainId: domain.id,
      crawlRunId: crawlRun.id,
      url: "https://rankforge.dev/",
      normalizedUrl: "https://rankforge.dev/",
      finalUrl: "https://rankforge.dev/",
      statusCode: 200,
      redirectChain: [],
      title: "RankForge | AI SEO Platform",
      metaDescription: "Audit sites, prioritize issues, and ship fixes faster.",
      h1: "Technical SEO that actually points to the next move",
      wordCount: 380,
      schemaCount: 1,
      missingAltCount: 0,
      internalLinkCount: 12,
      htmlBytes: 19000,
      depth: 0
    }
  });

  const pricingPage = await db.crawlPage.create({
    data: {
      projectId: project.id,
      domainId: domain.id,
      crawlRunId: crawlRun.id,
      url: "https://rankforge.dev/pricing",
      normalizedUrl: "https://rankforge.dev/pricing",
      finalUrl: "https://rankforge.dev/pricing",
      statusCode: 200,
      redirectChain: [],
      title: "Pricing",
      metaDescription: null,
      h1: "Pricing",
      wordCount: 124,
      schemaCount: 0,
      missingAltCount: 1,
      internalLinkCount: 3,
      htmlBytes: 11000,
      depth: 1
    }
  });

  const docsPage = await db.crawlPage.create({
    data: {
      projectId: project.id,
      domainId: domain.id,
      crawlRunId: crawlRun.id,
      url: "https://rankforge.dev/docs",
      normalizedUrl: "https://rankforge.dev/docs",
      finalUrl: "https://rankforge.dev/docs",
      statusCode: 200,
      redirectChain: [],
      title: "Pricing",
      metaDescription: "Documentation for RankForge setup and workflows.",
      h1: null,
      wordCount: 240,
      schemaCount: 0,
      missingAltCount: 0,
      internalLinkCount: 0,
      htmlBytes: 14200,
      depth: 1
    }
  });

  await db.crawlLink.createMany({
    data: [
      {
        projectId: project.id,
        crawlRunId: crawlRun.id,
        fromPageUrl: homePage.normalizedUrl,
        toUrl: "/pricing",
        normalizedToUrl: pricingPage.normalizedUrl,
        anchorText: "Pricing",
        isInternal: true,
        isBroken: false
      },
      {
        projectId: project.id,
        crawlRunId: crawlRun.id,
        fromPageUrl: homePage.normalizedUrl,
        toUrl: "/docs",
        normalizedToUrl: docsPage.normalizedUrl,
        anchorText: "Docs",
        isInternal: true,
        isBroken: false
      },
      {
        projectId: project.id,
        crawlRunId: crawlRun.id,
        fromPageUrl: pricingPage.normalizedUrl,
        toUrl: "/checkout",
        normalizedToUrl: "https://rankforge.dev/checkout",
        anchorText: "Checkout",
        isInternal: true,
        isBroken: true
      }
    ]
  });

  const issues = await Promise.all([
    db.crawlIssue.create({
      data: {
        projectId: project.id,
        domainId: domain.id,
        crawlRunId: crawlRun.id,
        pageId: pricingPage.id,
        ruleKey: "missing-meta-description",
        title: "Missing meta description",
        summary: "The pricing page is missing a meta description.",
        category: IssueCategory.METADATA,
        severity: IssueSeverity.MEDIUM,
        effort: EffortEstimate.LOW,
        impactScore: 43,
        affectedUrl: pricingPage.normalizedUrl
      }
    }),
    db.crawlIssue.create({
      data: {
        projectId: project.id,
        domainId: domain.id,
        crawlRunId: crawlRun.id,
        pageId: pricingPage.id,
        ruleKey: "thin-content",
        title: "Thin content heuristic",
        summary: "The pricing page has very little supporting copy.",
        category: IssueCategory.CONTENT,
        severity: IssueSeverity.MEDIUM,
        effort: EffortEstimate.MEDIUM,
        impactScore: 38,
        affectedUrl: pricingPage.normalizedUrl
      }
    }),
    db.crawlIssue.create({
      data: {
        projectId: project.id,
        domainId: domain.id,
        crawlRunId: crawlRun.id,
        pageId: docsPage.id,
        ruleKey: "duplicate-title",
        title: "Duplicate title tag",
        summary: "The docs page shares a title tag with another page.",
        category: IssueCategory.METADATA,
        severity: IssueSeverity.MEDIUM,
        effort: EffortEstimate.LOW,
        impactScore: 35,
        affectedUrl: docsPage.normalizedUrl
      }
    }),
    db.crawlIssue.create({
      data: {
        projectId: project.id,
        domainId: domain.id,
        crawlRunId: crawlRun.id,
        pageId: docsPage.id,
        ruleKey: "missing-h1",
        title: "Missing H1",
        summary: "The docs page does not define a primary heading.",
        category: IssueCategory.CONTENT,
        severity: IssueSeverity.MEDIUM,
        effort: EffortEstimate.LOW,
        impactScore: 29,
        affectedUrl: docsPage.normalizedUrl
      }
    }),
    db.crawlIssue.create({
      data: {
        projectId: project.id,
        domainId: domain.id,
        crawlRunId: crawlRun.id,
        pageId: pricingPage.id,
        ruleKey: "broken-internal-link",
        title: "Broken internal link",
        summary: "Pricing links to a missing checkout page.",
        category: IssueCategory.LINKS,
        severity: IssueSeverity.HIGH,
        effort: EffortEstimate.LOW,
        impactScore: 52,
        affectedUrl: pricingPage.normalizedUrl
      }
    })
  ]);

  await db.searchConsoleConnection.upsert({
    where: {
      projectId: project.id
    },
    update: {
      connectedById: user.id,
      propertyUrl: "sc-domain:rankforge.dev",
      propertyLabel: "rankforge.dev",
      propertyPermissionLevel: "siteOwner",
      lastSyncedAt: new Date(),
      lastSyncError: null
    },
    create: {
      projectId: project.id,
      connectedById: user.id,
      propertyUrl: "sc-domain:rankforge.dev",
      propertyLabel: "rankforge.dev",
      propertyPermissionLevel: "siteOwner",
      lastSyncedAt: new Date(),
      lastSyncError: null
    }
  });

  await db.searchConsoleMetric.createMany({
    data: [
      {
        projectId: project.id,
        pageUrl: homePage.normalizedUrl,
        date: new Date("2026-03-24"),
        clicks: 92,
        impressions: 1840,
        ctr: 0.05,
        position: 8.2
      },
      {
        projectId: project.id,
        pageUrl: pricingPage.normalizedUrl,
        date: new Date("2026-03-24"),
        clicks: 31,
        impressions: 790,
        ctr: 0.039,
        position: 11.4
      },
      {
        projectId: project.id,
        pageUrl: docsPage.normalizedUrl,
        date: new Date("2026-03-24"),
        clicks: 14,
        impressions: 220,
        ctr: 0.064,
        position: 9.7
      }
    ],
    skipDuplicates: true
  });

  await db.pageSpeedSnapshot.createMany({
    data: [
      {
        projectId: project.id,
        pageUrl: homePage.normalizedUrl,
        strategy: "mobile",
        performanceScore: 76,
        seoScore: 92,
        accessibilityScore: 88,
        bestPracticesScore: 83,
        lcpMs: 2200,
        inpMs: 180,
        cls: 0.06,
        capturedAt: new Date()
      },
      {
        projectId: project.id,
        pageUrl: pricingPage.normalizedUrl,
        strategy: "mobile",
        performanceScore: 61,
        seoScore: 82,
        accessibilityScore: 81,
        bestPracticesScore: 79,
        lcpMs: 2900,
        inpMs: 230,
        cls: 0.11,
        capturedAt: new Date()
      }
    ]
  });

  await db.aiRecommendation.createMany({
    data: [
      {
        projectId: project.id,
        crawlRunId: crawlRun.id,
        issueId: issues[4]?.id,
        pageUrl: pricingPage.normalizedUrl,
        type: RecommendationType.PROJECT,
        title: "Repair the pricing funnel path",
        summary: "Fix the broken internal link on pricing before shipping copy changes so users and crawlers can reach the conversion path.",
        rationale: "This issue is both high severity and conversion-adjacent, so it has the clearest upside for crawl health and revenue.",
        actionsJson: [
          "Restore the missing checkout destination or remove the broken CTA.",
          "Re-crawl the pricing page to confirm the error link is gone.",
          "Add a monitoring check for key conversion paths."
        ],
        sourceRuleKeys: ["broken-internal-link"],
        model: "heuristic-fallback"
      }
    ]
  });

  console.log(`Seeded workspace ${workspace.slug} with demo project ${project.slug}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
