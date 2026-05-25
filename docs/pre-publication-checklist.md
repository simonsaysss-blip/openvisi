# Pre-Publication Checklist

Use this checklist before making OpenVisi public on GitHub.

## Repository State

- [ ] Working tree is clean.
- [ ] `package-lock.json` is committed.
- [ ] `reports/` is ignored as runtime output.
- [ ] `examples/reports/example-com/` is committed as the curated demo report.
- [ ] No API keys, private tokens, private crawl data, or local `.env` files are committed.
- [ ] License is visible as MIT.

## Local Validation

Run:

```bash
npm install
npm run build
npm run typecheck
npm test
npm run lint
npm run cli -- scan https://example.com
```

Expected result:

- [ ] Install succeeds.
- [ ] Build succeeds for CLI and web.
- [ ] TypeScript passes.
- [ ] Tests pass.
- [ ] Lint passes.
- [ ] CLI scan writes `reports/example-com/report.md`, `report.json`, and `report.html`.

Known follow-up:

- `npm install` may report moderate dependency vulnerabilities. Do not run `npm audit fix --force` without reviewing breaking changes.

## README and Documentation

- [ ] README uses npm-first commands.
- [ ] README does not claim the package is published.
- [ ] README does not include `npx openvisi scan` unless npm publishing has been completed and verified.
- [ ] README links resolve locally.
- [ ] Methodology describes the score as heuristic and directional.
- [ ] Documentation does not claim rankings, citations, or answer inclusion can be guaranteed.
- [ ] Roadmap is restrained and OSS-first.

## GitHub Actions

- [ ] CI uses Node.js 20.
- [ ] CI uses `npm ci`.
- [ ] CI runs typecheck, tests, lint, and build.
- [ ] Workflow permissions are read-only with `contents: read`.
- [ ] Workflow does not use `pull_request_target`.
- [ ] Workflow does not reference repository secrets.

## GitHub Repository Settings

Suggested repository name:

```text
openvisi
```

Suggested description:

```text
Open-source AI visibility analytics infrastructure for the LLM search era.
```

Suggested topics:

```text
ai-search
llm
visibility
analytics
seo
typescript
cli
open-source
```

Before public launch:

- [ ] Repository visibility is set intentionally.
- [ ] About description is filled in.
- [ ] Topics are added.
- [ ] Default branch is `main`.
- [ ] GitHub Actions pass after first push.

## Post-Publication

- [ ] Confirm README renders correctly on GitHub.
- [ ] Confirm demo report links render correctly on GitHub.
- [ ] Confirm MIT license is detected by GitHub.
- [ ] Open a first issue for methodology hardening.
- [ ] Open a first issue for fixture-based analyzer tests.
- [ ] Prepare Claude for Open Source application only after the public repo and CI are available.
