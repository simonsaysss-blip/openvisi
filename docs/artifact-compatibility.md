# Artifact Compatibility

OpenVisi artifact bundles are intended to be consumed by downstream packages without depending on CLI internals.

## Contract Ownership

Shared artifact contracts live in `packages/core`.

Downstream packages should import artifact types and validators from `@openvisi/core`, not from `apps/cli`.

The CLI is responsible for filesystem reads, writes, and inspection commands. It is not the source of truth for artifact schemas.

## Bundle Entry Point

`artifact-manifest.json` is the entry point for an output directory. It lists generated artifacts, relative paths, the producing stage, and warnings.

Downstream modules should validate the manifest before reading artifact payloads.

## Report References

`report-references.json` maps existing artifacts to future report sections. It is a reference map, not a completed report.

Stage 2F references `structure-trust-inputs.json` for:

- AI-readable Structure
- Machine-readable Trust
- AI Citation Signals
- Source Gaps

Raw `crawled-pages.json` and `crawler-summary.json` remain available as source evidence.

## Structure Trust Inputs

`structure-trust-inputs.json` is a crawler-derived input artifact. It summarizes structure and trust evidence from `crawled-pages.json` and `crawler-summary.json`.

It is safe for future report and metrics modules to consume as an input artifact.

It is not `metrics.json`.

It is not a completed AI Visibility scan.

It must not be used alone to compute `aiVisibilityScore`.

## Evaluator Artifacts

Stage 3A adds provider-agnostic evaluator contracts in `packages/core` and a deterministic mock provider in `packages/evaluator`.

Downstream modules should consume `AnswersArtifact` through `@openvisi/core` contracts.

`packages/evaluator` depends on core contracts and does not depend on `apps/cli`.

`answers.json` is a future full-scan artifact. It contains `LLMAnswer[]`, not computed metrics, and should not be interpreted as a completed AI Visibility scan.

## Answer Signal Inputs

Stage 3C adds `answer-signal-inputs.json` as an evaluator-side downstream input artifact.

Downstream modules can consume it for transparent answer and citation signal inputs.

They should not treat it as final metrics.

They should not compute or infer `aiVisibilityScore` from it alone.

## Measurement Inputs

Stage 3D adds `measurement-inputs.json` as the composed input bundle for future metrics composition.

It combines:

- `structure-trust-inputs.json` from a `static-crawl` bundle
- `answer-signal-inputs.json` from an `evaluation` bundle

Downstream metrics composers should consume `measurement-inputs.json` through `@openvisi/core` contracts.

They should not depend on `apps/cli` internals.

They should not treat `measurement-inputs.json` as final metrics, a completed scan result, or an `aiVisibilityScore`.

When mock evaluator signals are included, downstream modules should preserve the limitation that the evaluator evidence is deterministic mock output, not real LLM evidence.

## Metrics Draft

Stage 4A adds `metrics-draft.json` as a transparent draft composition artifact derived from `measurement-inputs.json`.

Downstream metrics composers may use `metrics-draft.json` for review, debugging, and formula traceability.

They should not treat draft values as production scores.

They should not treat `metrics-draft.json` as `metrics.json`, a completed scan result, or final `aiVisibilityScore`.

Final metrics composition should continue to consume typed contracts from `@openvisi/core` and preserve source limitations, especially when evidence comes from the mock evaluator.

## Metrics Review Gate

Stage 4B adds `metrics-review.json` as the review gate before future final metrics composition.

Downstream final metrics composers should require a passing metrics review before producing final `metrics.json`.

They should not generate final `aiVisibilityScore` when `metrics-review.json` reports:

- `readyForFinalMetrics: false`
- `readyForAiVisibilityScore: false`
- `productionReady: false`

When evaluator evidence is mock, the review gate blocks evaluator-derived metrics from finalization and keeps final scoring excluded.

## Metrics Finalization Guard

Stage 4C adds `metrics-finalization.json` as the final permission gate before any future final metrics generation.

Downstream final metrics composers must check `metrics-finalization.json` before producing `metrics.json`.

Final metrics must not be produced when:

- `status` is `blocked`
- `allowedToGenerateMetricsJson` is `false`
- `allowedToComputeAiVisibilityScore` is `false`

Under mock evaluator evidence, the finalization guard blocks final metrics and final `aiVisibilityScore`.
