# OpenVisi Decisions

> **STOPPED_BY_OWNER / ARCHIVED — 2026-10-02**
> 專案擁有者已明確決定終止 OpenVisi／VisiFix。本機封存保留程式、既有變更、測試與歷史成果；停止新開發、研究與週報，除非擁有者日後重新明確授權。以下既有內容為歷史紀錄，任何 next step、roadmap、貢獻或執行指令均不代表目前授權。雲端服務與排程是否實際停止另見 [結案紀錄](CLOSURE_2026-10-02.md)，不能由此標記推定。


Last updated: 2026-06-12

## D1. OpenVisi Remains CLI-first

OpenVisi is an AI Visibility measurement and diagnostics infrastructure project. The primary surfaces are CLI commands, schemas, artifacts, benchmark outputs, and static reports.

Non-goals remain:

- SaaS dashboard
- Auth
- Billing
- Teams or workspaces
- Multi-tenant architecture
- Database-backed product workflow

## D2. Mock Artifact Pipeline and Benchmark Harness Are Separate

The mock artifact pipeline exists for methodology validation and reviewer onboarding. It intentionally blocks final AI Visibility scoring under mock evidence.

The benchmark harness can produce benchmark-specific `metrics.json`, `cost.json`, and `report/benchmark.md`. These benchmark outputs are not the same as the gated final metrics artifact from the RC artifact pipeline.

## D3. Current Benchmark Default Is OpenAI Pilot

`bench.config.json` currently uses the OpenAI provider with `gpt-4o-mini`.

The no-key path is `npm run demo:mock`, not the provider-backed benchmark harness.

## D4. Provider Evidence Must Stay Auditable

Provider-backed runs should preserve raw response text, provider metadata, usage, citations when available, and evidence-gate metadata.

Grounded and parametric results must remain separated.

## D5. Cloud Run Uses Secret Manager for Provider Keys

Cloud Run should receive `OPENAI_API_KEY` through Secret Manager using `--set-secrets`.

Do not commit API keys. Do not pass provider keys as plain `--set-env-vars` values.

## D6. Legacy Scan Is Compatibility-only

`openvisi scan <url>` remains a Legacy Static Analyzer path. Its output must not be described as a final AI Visibility Score or the current RC artifact pipeline.

## D7. Public Positioning

Use this canonical definition:

AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.

OpenVisi should not be positioned as:

- AI SEO
- SEO for ChatGPT
- ranking optimization
- citation guarantee system
- growth hack

## D8. Reviewable Change Discipline

Prefer small pull requests with clear validation. Keep provider changes in provider or benchmark layers, deployment changes in `infra/`, and methodology changes in docs.
