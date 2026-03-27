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
