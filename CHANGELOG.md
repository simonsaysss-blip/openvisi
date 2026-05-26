# Changelog

All notable changes to OpenVisi will be documented in this file.

The format follows Keep a Changelog principles, and this project currently uses pre-1.0 versioning.

## [Unreleased]

- Release candidate hygiene and public repository readiness work.

## [0.1.0] - Draft

### Added

- Artifact-based mock pipeline from dry-run planning through debug report generation.
- Static crawler artifacts:
  - `crawled-pages.json`
  - `crawler-summary.json`
  - `structure-trust-inputs.json`
- Deterministic mock evaluator artifacts:
  - `answers.json`
  - `answer-signal-inputs.json`
- `measurement-inputs.json` composition from crawler and evaluator inputs.
- `metrics-draft.json` with transparent draft formulas.
- `metrics-review.json` review gate for draft metrics.
- `metrics-finalization.json` finalization guard that blocks final metrics under mock evidence.
- `debug-report.md` for human-readable artifact pipeline inspection.
- `npm run demo:mock` local demo verification using a local fixture server.
- `npm run release:rehearse` local v0.1.0 package rehearsal with CLI tarball install smoke.
- `npm run release:rc-check` release candidate freeze gate for docs and runtime artifact hygiene.
- OSS readiness docs, GitHub issue templates, PR template, CI workflow, and optional mock demo workflow.

### Current Limitations

- No real provider adapters yet.
- No `metrics.json` is generated yet.
- No final AI Visibility Score is computed yet.
- No production scoring is included yet.
- Mock evaluator evidence is deterministic test evidence, not real LLM evidence.
