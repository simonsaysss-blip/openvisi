# OpenVisi Artifact Debug Report

## Status

- This is an artifact debug report.
- This is not a final AI Visibility report.
- No final AI Visibility Score is computed.
- Mock evaluator evidence is not real LLM evidence.
- Final metrics generation is blocked by the finalization guard.

## Artifact Chain

| Stage | Validation | Summary |
| --- | --- | --- |
| dry-run | passed | Config and prompt planning artifacts exist. |
| static-crawl | passed | Static crawler evidence exists. |
| evaluation | passed | Mock evaluator artifacts exist. |
| measurement-inputs | passed | Structure/trust and answer signal inputs were composed. |
| metrics-draft | passed | Draft metric values were produced for review. |
| metrics-review | passed | Final scoring is blocked under mock evidence. |
| metrics-finalization | passed | `metrics.json` generation is not allowed. |

## Finalization Guard

- status: blocked
- allowedToGenerateMetricsJson: false
- allowedToComputeAiVisibilityScore: false
- allowedToGenerateScanResult: false

## Why No AI Visibility Score Yet

The current demo uses deterministic mock evaluator evidence. Mock evidence is useful for local pipeline validation, but it is not real LLM evidence. Final AI Visibility scoring requires real provider evidence and passing review gates.
