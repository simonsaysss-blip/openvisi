# Metrics Review

Stage 4B introduces `metrics-review.json`.

This artifact reviews `metrics-draft.json` and decides whether draft metrics are ready for future final metrics composition.

It is not `metrics.json`.

It does not compute final `aiVisibilityScore`.

It does not imply a completed AI Visibility scan.

## Command

```bash
npx openvisi metrics review \
  --metrics-draft-output openvisi-metrics-draft \
  --output openvisi-metrics-review
```

The command writes:

```text
openvisi-metrics-review/
  metrics-review.json
  artifact-manifest.json
  warnings.json
```

It does not write `metrics.json`, `scan-result.json`, reports, citation artifacts, or raw source artifacts.

## What It Reviews

`metrics-review.json` reviews only `metrics-draft.json`.

It does not read `measurement-inputs.json`.

It does not recompute draft values.

It does not compute final metrics.

## Review Logic

Stage 4B blocks finalization when evaluator evidence is mock.

Evaluator-derived draft metrics are blocked under mock evidence:

- `answerPresence`
- `answerShare`
- `entityClarity`
- `citationCoverage`
- `competitorDisplacement`
- `narrativeAccuracy`

Crawler-derived draft metrics can still be marked `review_required`:

- `aiReadableStructure`
- `machineReadableTrust`
- `aiCitationSignals`

`narrativeAccuracy` remains blocked unless real LLM evidence or human review is available.

## Purpose

This artifact exists to prevent premature scoring.

Future final metrics composers should require the review gate before producing final metrics.

If the review gate blocks readiness, final `metrics.json` and final `aiVisibilityScore` should not be generated.

## Finalization Guard

Stage 4C adds `metrics-finalization.json` as the next guard after metrics review.

Run it before any future final metrics generation:

```bash
npx openvisi metrics guard \
  --metrics-review-output openvisi-metrics-review \
  --output openvisi-metrics-finalization
```

The finalization guard is the artifact future final metrics composers should check before writing `metrics.json`.
