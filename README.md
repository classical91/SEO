# RankForge

RankForge is an AI-assisted SEO SaaS focused on technical audits, connected performance data, and plain-language fix recommendations.

## Workspace

- `apps/web` - Next.js 15 App Router product surface
- `apps/worker` - BullMQ worker for crawl, integration sync, and AI jobs
- `packages/db` - Prisma schema, client, and seed data
- `packages/crawler` - HTTP-first crawler with optional Playwright rendering fallback
- `packages/seo` - deterministic SEO rules engine and scoring
- `packages/integrations` - Search Console and PageSpeed services
- `packages/ai` - AI recommendation service with OpenAI and heuristic fallback
- `packages/ui` - shared UI primitives and charts helpers

## Quick Start

1. Copy `.env.example` to `.env` and fill in credentials.
2. Start local Postgres and Redis with `corepack pnpm infra:up`.
3. Install dependencies with `corepack pnpm install`.
4. Generate Prisma client with `corepack pnpm db:generate`.
5. Run migrations with `corepack pnpm db:migrate`.
6. Seed sample data with `corepack pnpm db:seed`.
7. Start the app with `corepack pnpm dev`.

`QUEUE_DRIVER=inline` lets the web app process jobs without Redis for local development. Set `QUEUE_DRIVER=bullmq` with `REDIS_URL` when you want dedicated background processing.

## Railway Deployment

This repo is set up for Railway's JavaScript monorepo import flow. Import the repo into Railway and let it create separate services for:

- `apps/web` using [apps/web/railway.toml](apps/web/railway.toml)
- `apps/worker` using [apps/worker/railway.toml](apps/worker/railway.toml)
- PostgreSQL
- Redis

You do not need to set a custom root directory when importing. Railway's JavaScript monorepo detection will stage the package services automatically and read the package-level `railway.toml` files.

The web service now exposes `/api/health` for Railway healthchecks and runs Prisma migrations during deploy with `prisma migrate deploy`.

Recommended Railway variables:

- Web service: `DATABASE_URL`, `REDIS_URL`, `QUEUE_DRIVER=bullmq`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SEARCH_CONSOLE_SCOPES`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PAGESPEED_API_KEY`
- Worker service: `DATABASE_URL`, `REDIS_URL`, `QUEUE_DRIVER=bullmq`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_SEARCH_CONSOLE_SCOPES`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `PAGESPEED_API_KEY`

For the web service, set `NEXTAUTH_URL` to your Railway public domain after generating one, for example `https://${{RAILWAY_PUBLIC_DOMAIN}}`.

The worker service does not need a public domain. It should stay private and only connect to Redis and Postgres over Railway's internal network.
