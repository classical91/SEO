-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CrawlRunStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EffortEstimate" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CrawlIssueStatus" AS ENUM ('OPEN', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "IssueCategory" AS ENUM ('INDEXABILITY', 'METADATA', 'CONTENT', 'LINKS', 'PERFORMANCE', 'STRUCTURED_DATA');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('PROJECT', 'PAGE');

-- CreateEnum
CREATE TYPE "MembershipInviteStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MembershipInviteStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Domain" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "homepageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCrawledAt" TIMESTAMP(3),

    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "triggeredById" TEXT,
    "status" "CrawlRunStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "score" INTEGER,
    "pagesDiscovered" INTEGER NOT NULL DEFAULT 0,
    "pagesCrawled" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlPage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "crawlRunId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "normalizedUrl" TEXT NOT NULL,
    "finalUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "statusCode" INTEGER NOT NULL,
    "redirectChain" TEXT[],
    "title" TEXT,
    "metaDescription" TEXT,
    "h1" TEXT,
    "metaRobots" TEXT,
    "xRobotsTag" TEXT,
    "contentType" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "schemaCount" INTEGER NOT NULL DEFAULT 0,
    "missingAltCount" INTEGER NOT NULL DEFAULT 0,
    "internalLinkCount" INTEGER NOT NULL DEFAULT 0,
    "htmlBytes" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "isIndexableCandidate" BOOLEAN NOT NULL DEFAULT true,
    "discoveredFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "crawlRunId" TEXT NOT NULL,
    "fromPageUrl" TEXT NOT NULL,
    "toUrl" TEXT NOT NULL,
    "normalizedToUrl" TEXT NOT NULL,
    "anchorText" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "isBroken" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlIssue" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "crawlRunId" TEXT NOT NULL,
    "pageId" TEXT,
    "ruleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "IssueCategory" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "effort" "EffortEstimate" NOT NULL,
    "impactScore" INTEGER NOT NULL,
    "affectedUrl" TEXT NOT NULL,
    "status" "CrawlIssueStatus" NOT NULL DEFAULT 'OPEN',
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RobotsSnapshot" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "crawlRunId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "raw" TEXT,
    "blockedPaths" TEXT[],
    "sitemaps" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RobotsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SitemapUrl" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "crawlRunId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SitemapUrl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConsoleConnection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "connectedById" TEXT NOT NULL,
    "propertyUrl" TEXT NOT NULL,
    "propertyLabel" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchConsoleConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchConsoleMetric" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchConsoleMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSpeedSnapshot" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "performanceScore" INTEGER NOT NULL,
    "seoScore" INTEGER NOT NULL,
    "accessibilityScore" INTEGER NOT NULL,
    "bestPracticesScore" INTEGER NOT NULL,
    "lcpMs" DOUBLE PRECISION,
    "inpMs" DOUBLE PRECISION,
    "cls" DOUBLE PRECISION,
    "rawPayload" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSpeedSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRecommendation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "crawlRunId" TEXT,
    "issueId" TEXT,
    "pageUrl" TEXT,
    "type" "RecommendationType" NOT NULL DEFAULT 'PROJECT',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "actionsJson" JSONB NOT NULL,
    "sourceRuleKeys" TEXT[],
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_workspaceId_userId_key" ON "Membership"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_slug_key" ON "Project"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Domain_projectId_hostname_key" ON "Domain"("projectId", "hostname");

-- CreateIndex
CREATE UNIQUE INDEX "CrawlPage_crawlRunId_normalizedUrl_key" ON "CrawlPage"("crawlRunId", "normalizedUrl");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleConnection_projectId_key" ON "SearchConsoleConnection"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchConsoleMetric_projectId_pageUrl_date_key" ON "SearchConsoleMetric"("projectId", "pageUrl", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Domain" ADD CONSTRAINT "Domain_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlRun" ADD CONSTRAINT "CrawlRun_triggeredById_fkey" FOREIGN KEY ("triggeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlPage" ADD CONSTRAINT "CrawlPage_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlLink" ADD CONSTRAINT "CrawlLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlLink" ADD CONSTRAINT "CrawlLink_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlIssue" ADD CONSTRAINT "CrawlIssue_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlIssue" ADD CONSTRAINT "CrawlIssue_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlIssue" ADD CONSTRAINT "CrawlIssue_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlIssue" ADD CONSTRAINT "CrawlIssue_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "CrawlPage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotsSnapshot" ADD CONSTRAINT "RobotsSnapshot_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotsSnapshot" ADD CONSTRAINT "RobotsSnapshot_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitemapUrl" ADD CONSTRAINT "SitemapUrl_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SitemapUrl" ADD CONSTRAINT "SitemapUrl_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchConsoleConnection" ADD CONSTRAINT "SearchConsoleConnection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchConsoleConnection" ADD CONSTRAINT "SearchConsoleConnection_connectedById_fkey" FOREIGN KEY ("connectedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchConsoleMetric" ADD CONSTRAINT "SearchConsoleMetric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageSpeedSnapshot" ADD CONSTRAINT "PageSpeedSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRecommendation" ADD CONSTRAINT "AiRecommendation_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "CrawlIssue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
