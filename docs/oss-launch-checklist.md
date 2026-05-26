# OSS Launch Checklist

Use this checklist before and immediately after publishing OpenVisi on GitHub.

## Public Repository Verification

- [ ] Repository is public intentionally.
- [ ] Default branch is `main`.
- [ ] Repository description is set:

```text
Open-source AI-readable visibility diagnostics for the LLM search era.
```

- [ ] Repository topics are added:

```text
ai-search
llm
visibility
diagnostics
typescript
cli
open-source
```

## CI Verification

- [ ] GitHub Actions is enabled.
- [ ] The first `main` branch workflow run is green.
- [ ] CI uses Node.js 20.
- [ ] CI uses `npm ci`.
- [ ] CI runs typecheck, tests, lint, and build.
- [ ] CI permissions remain read-only with `contents: read`.
- [ ] CI does not use repository secrets.
- [ ] CI does not use `pull_request_target`.

## Release Tag Verification

- [ ] `v0.1.0` tag exists.
- [ ] `v0.1.0` tag points to the intended commit.
- [ ] `docs/release-notes/v0.1.0.md` is visible on GitHub.
- [ ] Release notes do not claim ranking prediction, citation guarantees, or production SaaS readiness.

## README Verification

- [ ] README renders correctly on GitHub.
- [ ] Quickstart uses npm-first commands.
- [ ] README does not claim npm package publication.
- [ ] README demo report links resolve.
- [ ] README methodology link resolves.
- [ ] README roadmap link resolves.

## Demo Report Verification

- [ ] `examples/reports/example-com/report.md` renders on GitHub.
- [ ] `examples/reports/example-com/report.json` is accessible.
- [ ] `examples/reports/example-com/report.html` is accessible.
- [ ] Demo report includes `methodologyVersion`.
- [ ] Demo report includes analyzer maturity labels.
- [ ] Demo report includes explainability fields.

## Governance and Contribution Signals

- [ ] MIT license is detected by GitHub.
- [ ] `CONTRIBUTING.md` is visible.
- [ ] `CODE_OF_CONDUCT.md` is visible.
- [ ] `SECURITY.md` is visible.
- [ ] Bug report issue template is visible.
- [ ] Feature request issue template is visible.

## Documentation Visibility

- [ ] `docs/architecture.md` is visible.
- [ ] `docs/methodology.md` is visible.
- [ ] `docs/roadmap.md` is visible.
- [ ] `docs/future-applications.md` is visible.
- [ ] `docs/pre-publication-checklist.md` is visible.

## Benchmark and Fixture Visibility

- [ ] `fixtures/README.md` explains directional fixture validation.
- [ ] Fixture folders are visible.
- [ ] `benchmarks/README.md` explains exploratory benchmark limitations.
- [ ] Exploratory benchmark folders are visible.
- [ ] Benchmark docs clearly state that no statistical conclusions are implied.

## Post-Launch Checks

- [ ] Clone the public repo into a clean directory.
- [ ] Run `npm ci`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `npm run cli -- scan https://example.com`.
