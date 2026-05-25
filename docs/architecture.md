# Architecture

OpenVisi is a CLI-first monorepo designed to become dashboard-ready without
requiring a SaaS backend in the MVP.

## Runtime flow

1. `apps/cli` validates command input.
2. `packages/crawler` fetches robots, sitemap, llms.txt, and up to 30 pages.
3. `packages/core` computes explainable scores from crawl evidence.
4. `packages/report` writes `report.md`, `report.json`, and `report.html`.
5. `apps/web` is reserved for a future local or hosted dashboard.

## Principles

- Respect `robots.txt` by default.
- No black-hat SEO features.
- No fake ranking claims.
- Every score must be traceable to evidence.
- Provider calls are BYOK-only and optional.
