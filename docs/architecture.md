# Architecture

OpenVisi is a CLI-first monorepo for collecting website crawl evidence, evaluating machine-readable visibility signals, and writing local reports.

## Runtime flow

1. `apps/cli` validates command input.
2. `packages/crawler` fetches robots, sitemap, llms.txt, and up to 30 pages.
3. `packages/core` computes explainable scores from crawl evidence.
4. `packages/report` writes `report.md`, `report.json`, and `report.html`.
5. `apps/web` is a minimal scaffold reserved for later local report viewing experiments.

## Principles

- Respect `robots.txt` by default.
- No ranking manipulation features.
- No claims of predicting proprietary AI product behavior.
- Every score must be traceable to evidence.
- Provider calls are BYOK-only and optional.
