# Local Mock Demo Verification

`npm run demo:mock` runs the current OpenVisi artifact pipeline against a deterministic local fixture site.

The command is intended for new contributors and CI-friendly local verification.

## Run

```bash
npm run demo:mock
```

The script creates `.openvisi-demo/`, starts a local HTTP fixture server with Node built-in modules, writes a mock-provider OpenVisi config, runs every current CLI stage, validates artifact bundles, and checks that final metrics are still blocked.

No external network access is required.

No API keys are required.

No real LLM provider is called.

`npm run demo:mock` is intentionally not part of the default CI workflow yet. It binds a local fixture server and remains an explicit verification command.

The repository includes an optional GitHub Actions workflow named `Mock Demo Verification` that can be run manually with `workflow_dispatch`.

## Clean

```bash
npm run demo:mock:clean
```

This removes `.openvisi-demo/`.

## What the Fixture Site Contains

The local fixture server serves deterministic HTML pages:

- `/`
- `/docs`
- `/faq`

The pages include clear headings, docs-like structure, FAQ-like structure, comparison-like content, JSON-LD, and canonical metadata. No external assets are required.

## Output

```text
.openvisi-demo/
  openvisi.config.json
  openvisi-report/
  openvisi-crawl/
  openvisi-eval/
  openvisi-measurement/
  openvisi-metrics-draft/
  openvisi-metrics-review/
  openvisi-metrics-finalization/
  openvisi-debug-report/
```

The debug report is written to:

```text
.openvisi-demo/openvisi-debug-report/debug-report.md
```

## Expected Result

The final summary should say:

```text
OpenVisi mock demo completed.
Final metrics generated: no
Final AI Visibility Score generated: no
Evidence mode: mock
Finalization status: blocked
```

This is expected. Mock evaluator evidence is not real LLM evidence, so final metrics generation remains blocked by design.

## What Is Not Generated

The demo verifier asserts that no output directory contains:

- `metrics.json`
- `scan-result.json`
- final `report.md`
- final `report.html`

`debug-report.md` is an artifact debug report. It is not a final AI Visibility report and does not compute an AI Visibility Score.
