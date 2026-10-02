# OpenVisi Status

> **STOPPED_BY_OWNER / ARCHIVED — 2026-10-02**
> 專案擁有者已明確決定終止 OpenVisi／VisiFix。本機封存保留程式、既有變更、測試與歷史成果；停止新開發、研究與週報，除非擁有者日後重新明確授權。以下既有內容為歷史紀錄，任何 next step、roadmap、貢獻或執行指令均不代表目前授權。雲端服務與排程是否實際停止另見 [結案紀錄](CLOSURE_2026-10-02.md)，不能由此標記推定。


Last verified: 2026-06-12

## Current State

OpenVisi is a CLI-first AI Visibility measurement and diagnostics project. The current working surface is split into two intentionally separate paths:

- Mock-only artifact pipeline for reproducible local review and methodology validation.
- Provider-backed benchmark harness for controlled AI Visibility benchmark pilots.

OpenVisi is not a SaaS dashboard, an AI SEO tool, or a production scoring service.

## Local Validation

The local repository currently passes:

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run check:docs
npm run check:metadata
npm run check:release-artifacts
```

## Cloud Run Status

- Service: `openvisi-api`
- Project: `gen-lang-client-0631649736`
- Region: `asia-east1`
- URL: `https://openvisi-api-re464v5xiq-de.a.run.app`
- Latest checked revision: `openvisi-api-00009-nfk`
- Health endpoint: `/health`
- Benchmark endpoint: `/run`

Cloud Run is deployed behind authenticated access. OpenAI credentials should be supplied through Secret Manager, not committed files or plain deployment arguments.

## Current Benchmark Path

The current `bench.config.json` uses:

- Provider: `openai`
- Model: `gpt-4o-mini`
- Modes: `grounded`, `parametric`
- Samples per cell: `2`
- Run ID: `pharma-qms-ai-visibility-benchmark-2026`

Benchmark outputs are flat files under:

```text
runs/{runId}/
```

The deployed benchmark run uploads artifacts to:

```text
gs://openvisi-artifacts-gen-lang-client-0631649736/runs/pharma-qms-ai-visibility-benchmark-2026/
```

Expected files include:

- `manifest.json`
- `config.snapshot.json`
- `raw/responses.jsonl`
- `raw/cache-index.json`
- `metrics.json`
- `cost.json`
- `report/benchmark.md`

Latest `/run` smoke result:

- Completed responses: `48`
- Error records: `0`
- Metric results: `24`
- Cost report status: `unknown` when provider usage or pricing is incomplete

## Mock Demo Path

The no-key local reviewer path remains:

```bash
npm run demo:mock
```

This path uses deterministic mock evidence and does not compute a final AI Visibility Score.

## Known Boundaries

- The benchmark harness can produce benchmark `metrics.json`; this is separate from the older RC artifact pipeline final metrics, which remain gated.
- `openvisi scan <url>` is legacy static analyzer compatibility, not the current benchmark path.
- Provider-backed benchmark outputs are pilot evidence and should not be marketed as production scoring.
- Cloud Run `/run` is a controlled benchmark trigger, not a public SaaS API.

## Immediate Next Step

Keep the next pull request scoped to documentation/status consolidation and deployment hygiene. Do not add dashboard, auth, billing, database, or multi-tenant features.
