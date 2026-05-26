# Contributing to OpenVisi

OpenVisi is an open-source measurement layer for AI Visibility. Contributions should strengthen reproducible artifacts, transparent methodology, and local developer workflows.

AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.

## Local Setup

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run build
npm run demo:mock
```

`npm run demo:mock` runs the local mock artifact pipeline against a local fixture server. It does not call real LLM providers and does not require API keys.

## Artifact Contract Discipline

OpenVisi is artifact-first. When changing artifacts:

- Do not generate `metrics.json` unless a future finalization stage explicitly allows it.
- Do not compute final `aiVisibilityScore` without a passing finalization guard.
- Do not write `scan-result.json` from intermediate stages.
- Do not introduce fake LLM evidence.
- Do not treat mock evaluator evidence as real LLM evidence.
- Do not add real provider calls without an explicit environment-gated design.
- Keep artifact paths relative in manifests.
- Keep golden fixtures updated when contracts change.

## Adding a New Artifact Stage

When adding a stage:

1. Add or update shared types in `packages/core`.
2. Add validation helpers without heavy schema dependencies.
3. Add the artifact type and stage to `packages/core/src/schema/artifacts.ts`.
4. Add CLI read/write logic in `apps/cli` only if the stage needs filesystem behavior.
5. Add a golden fixture under `test/fixtures/artifact-bundles/`.
6. Add tests for shape validation, artifact inspection, and forbidden output files.
7. Update docs and examples.

## Updating Golden Fixtures

Golden fixtures should be small, deterministic, and human-readable.

Use stable timestamps such as:

```text
2026-01-01T00:00:00.000Z
```

Do not include local absolute paths, generated runtime directories, private crawl output, API keys, or final metrics unless the stage contract explicitly requires them.

## Pull Requests

PRs should include:

- what stage or package changed
- whether artifact contracts changed
- whether golden fixtures changed
- commands run
- whether final metrics, final reports, or real provider calls were introduced

Expected validation:

```bash
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
```

Run `npm run demo:mock` for changes that affect CLI orchestration, artifact manifests, demo docs, or debug-report behavior.
