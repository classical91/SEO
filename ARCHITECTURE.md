# RankForge Architecture

## Runtime

- `apps/web` owns auth, onboarding, workspace/project/domain CRUD, dashboards, and operator actions.
- `apps/worker` owns `crawl.run`, `gsc.sync`, `psi.collect`, and `ai.recommend` jobs.
- Shared packages keep domain logic portable between the web app, worker, and tests.

## Domain Boundaries

- `@rankforge/db` provides Prisma access, enums, and seeded fixtures.
- `@rankforge/crawler` discovers pages, links, robots rules, and sitemap sources.
- `@rankforge/seo` turns crawl output into deterministic issues and scores.
- `@rankforge/integrations` hydrates Google Search Console and PageSpeed data.
- `@rankforge/ai` explains issues and suggests fixes without controlling base priority.

## Delivery Notes

- Local development defaults to inline jobs to reduce setup friction.
- Production should run separate Railway services for `web`, `worker`, `postgres`, and `redis`.
- Search Console uses the authenticated Google account from Auth.js and persists project-level property mappings.
