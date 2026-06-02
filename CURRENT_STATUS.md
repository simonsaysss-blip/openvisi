# Current Status

## Repo Shape

- `apps/cli`: OpenVisi CLI commands for artifact inspection, mock pipeline stages, benchmark harness operations, and legacy scan compatibility.
- `apps/web`: schema-backed directional benchmark demo surface.
- `packages/core`: shared schemas, canonical metrics, artifact contracts, report sections, and demo benchmark fixture.
- `packages/crawler`: static crawler and crawler-derived structure/trust inputs.
- `packages/evaluator`: mock evaluator contracts, answer artifacts, and evaluator-derived signal inputs.
- `packages/benchmark`: flat-file benchmark harness for runs, rule-based scoring, Markdown report generation, and cost estimates.
- `packages/report`: legacy static diagnostic report generation.
- `packages/analyzer`: analyzer facade for legacy diagnostics.
- `packages/providers`: provider adapter placeholder package.

## Current RC Truth

- CLI artifact pipeline is current RC truth.
- Web demo is directional and schema-backed.
- Legacy scan is compatibility-only.

## Completed Infrastructure

- Canonical metrics schema
- Benchmark schema
- Report section schema
- Demo benchmark fixture
- Benchmark artifact commands
- Reviewer docs
- Vocabulary guard
- Docs navigation checks

## Known Confusion Risks

- Demo `aiVisibilityScore` can be mistaken for final score.
- Future design/product docs can read like SaaS promises.
- Design partner language should remain pilot / future-facing.
- Docs overlap between RC, benchmark, legacy scan, and future design.

## Next Recommended PR

Prepare local CLI demo path only after public RC positioning is consolidated.
