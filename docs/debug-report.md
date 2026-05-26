# Artifact Debug Report

`debug-report.md` is a human-readable summary of an OpenVisi artifact pipeline.

For the full command sequence, see [Quickstart](quickstart.md).

For the stage-by-stage pipeline map, see [Demo Pipeline](demo-pipeline.md).

It is generated from existing artifact bundles:

- dry-run
- static-crawl
- evaluation
- measurement-inputs
- metrics-draft
- metrics-review
- metrics-finalization

The debug report exists to make OSS demos and local debugging easier. It explains which artifacts exist, which stages validated, and why final metrics are still blocked.

## Not a Final Report

`debug-report.md` is not the final AI Visibility report.

It does not compute an AI Visibility Score.

It does not generate `metrics.json`.

It does not generate `scan-result.json`.

It does not generate `report.md` or `report.html`.

## Evidence Scope

The command loads only small summary artifacts:

- `scan-plan.json`
- `crawler-summary.json`
- `structure-trust-inputs.json`
- `answer-signal-inputs.json`
- `measurement-inputs.json`
- `metrics-draft.json`
- `metrics-review.json`
- `metrics-finalization.json`

It does not load raw `crawled-pages.json`.

It does not load raw `answers.json`.

## Mock Evidence

When the evaluation bundle uses the mock provider, the debug report explicitly states that mock evaluator evidence is not real LLM evidence.

Under mock evidence, final metrics generation remains blocked by the metrics review and finalization guard.

## Output

```text
openvisi-debug-report/
  debug-report.md
  artifact-manifest.json
  warnings.json
```

The debug-report stage intentionally excludes final metrics, scan results, raw answers, raw crawled pages, and final reports.

## Example

See [examples/debug-report.example.md](../examples/debug-report.example.md) for a small curated example.
