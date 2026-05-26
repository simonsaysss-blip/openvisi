# Contributing to OpenVisi

OpenVisi is CLI-first, OSS-first, and report-first. Contributions should keep
scores explainable, avoid ranking manipulation tactics, and respect `robots.txt`
by default.

## Local setup

```bash
npm install
npm run build
npm run cli -- scan https://example.com
npm run lint
npm run typecheck
npm test
```

## Development principles

- Keep the CLI usable without API keys.
- Keep scoring explainable and evidence-backed.
- Prefer small, testable changes over architecture rewrites.
- Treat provider-backed LLM evaluation as optional and BYOK-only.
- Avoid ranking guarantees or claims of manipulating AI search systems.

## Pull request checklist

- Add or update tests for scoring, crawling, or reporting logic.
- Keep provider integrations BYOK-only.
- Do not commit API keys, generated reports, or large crawl artifacts.
- Do not commit runtime files under `reports/`; curated examples belong under `examples/reports/`.
- Make every score traceable to concrete evidence, issues, or recommendations.
