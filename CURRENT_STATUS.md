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
- `packages/providers`: provider adapters and evidence gates for controlled provider-backed benchmark pilots.

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
- OpenAI benchmark provider pilot
- Cloud Run benchmark trigger and GCS artifact upload
- Reviewer docs
- Vocabulary guard
- Docs navigation checks

## Known Confusion Risks

- Demo `aiVisibilityScore` can be mistaken for final score.
- Future design/product docs can read like SaaS promises.
- Design partner language should remain pilot / future-facing.
- Docs overlap between RC, benchmark, legacy scan, and future design.
- The mock-only artifact pipeline and provider-backed benchmark harness can be confused if docs do not keep them separate.

## Next Recommended PR

Keep deployment hygiene and status docs synchronized before adding any new product surface.
