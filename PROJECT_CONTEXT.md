# PROJECT_CONTEXT.md

## Project Identity
OpenVisi 是 AI Visibility measurement / diagnostics 的 CLI-first OSS 專案，目前重點是 artifact pipeline、benchmark harness、review gates 與 methodology。

## Source Of Truth
- Root README: `README.md`
- CLI app: `apps/cli`
- Core packages: `packages/*`
- Docs: `docs`
- Current status: `docs/STATUS.md`
- Decisions: `docs/DECISIONS.md`

## Key Commands
```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run demo:mock
npm run release:check
```

## Current Scope
- CLI-first artifact pipeline
- Flat-file benchmark harness
- Mock-first and provider-gated execution
- Metrics draft / review / finalization guard
- Debug and benchmark reports
- Public methodology and vocabulary docs

## Explicit Non-goals
- SaaS dashboard
- Auth, billing, teams, workspaces, or multi-tenant features
- Database-backed product workflows
- Provider calls without explicit environment-gated execution
- Final AI Visibility Score without evidence gates

## Operating Rule
Prefer small, reviewable changes that reinforce OpenVisi's AI Visibility measurement model, benchmark schema, artifact pipeline, and public RC positioning.
