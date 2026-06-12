# OpenVisi Decisions

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
