# Current Status

> **STOPPED_BY_OWNER / ARCHIVED — 2026-10-02**
> 專案擁有者已明確決定終止 OpenVisi／VisiFix。本機封存保留程式、既有變更、測試與歷史成果；停止新開發、研究與週報，除非擁有者日後重新明確授權。以下既有內容為歷史紀錄，任何 next step、roadmap、貢獻或執行指令均不代表目前授權。雲端服務與排程是否實際停止另見 [結案紀錄](docs/CLOSURE_2026-10-02.md)，不能由此標記推定。


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
