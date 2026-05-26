# Metrics Finalization Guard

Stage 4C introduces `metrics-finalization.json`.

This artifact is a finalization guard.

It decides whether a future stage is allowed to generate final `metrics.json`.

It is not `metrics.json`.

It does not compute final `aiVisibilityScore`.

It does not produce `scan-result.json`.

## Command

```bash
npx openvisi metrics guard \
  --metrics-review-output openvisi-metrics-review \
  --output openvisi-metrics-finalization
```

The command writes:

```text
openvisi-metrics-finalization/
  metrics-finalization.json
  artifact-manifest.json
  warnings.json
```

It does not write `metrics.json`, `scan-result.json`, reports, citation artifacts, or raw source artifacts.

## Guard Logic

The guard reads only `metrics-review.json`.

It does not read `metrics-draft.json`.

It does not recompute draft values.

It does not compute final metrics.

Under mock evaluator evidence, finalization is blocked:

- `allowedToGenerateMetricsJson: false`
- `allowedToComputeAiVisibilityScore: false`
- `allowedToGenerateScanResult: false`

Finalization also remains blocked when:

- metrics review readiness is false
- `readyForAiVisibilityScore` is false
- `productionReady` is false
- any metric review entry is blocked
- `narrativeAccuracy` remains unavailable

## Purpose

This artifact prevents premature scoring.

Future final metrics composers must check `metrics-finalization.json` before producing final `metrics.json`.

If `status` is `blocked`, final metrics and final `aiVisibilityScore` must not be generated.
