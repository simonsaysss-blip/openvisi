# OpenVisi Artifact Debug Report

## Status

- This is an artifact debug report.
- This is not a final AI Visibility report.
- No final AI Visibility Score is computed.
- Mock evaluator evidence is not real LLM evidence.
- Final metrics generation is blocked by the finalization guard.

## Artifact Chain

| Stage | Source Output Directory | Validation | Artifact Count |
| --- | --- | --- | ---: |
| dry-run | test/fixtures/artifact-bundles/dry-run | passed | 5 |
| static-crawl | test/fixtures/artifact-bundles/static-crawl | passed | 6 |
| evaluation | test/fixtures/artifact-bundles/evaluation | passed | 6 |
| measurement-inputs | test/fixtures/artifact-bundles/measurement-inputs | passed | 3 |
| metrics-draft | test/fixtures/artifact-bundles/metrics-draft | passed | 3 |
| metrics-review | test/fixtures/artifact-bundles/metrics-review | passed | 3 |
| metrics-finalization | test/fixtures/artifact-bundles/metrics-finalization | passed | 3 |

## Why No AI Visibility Score Yet

- The current pipeline uses mock evaluator evidence.
- narrativeAccuracy is not final.
- Final metrics are blocked by the review and finalization guard.
- Final aiVisibilityScore is intentionally excluded.
- Real provider evidence and review gates are required before final scoring.
