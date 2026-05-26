# OpenVisi Quickstart

This guide runs the current OpenVisi OSS demo pipeline locally.

The pipeline uses deterministic mock evaluator evidence. Mock evidence is not real LLM evidence, so final metrics generation is blocked by design and no final AI Visibility Score is computed.

## Prerequisites

- Node.js 20 or newer
- npm
- macOS, Linux, or another shell environment that can run npm scripts

## Install and Build

```bash
npm install
npm run build
```

## Recommended Demo Verification

For the fastest local verification path, run:

```bash
npm run demo:mock
```

This starts a local HTTP fixture server and runs the full mock artifact pipeline under `.openvisi-demo/`. It requires no external network access and no API keys.

See [Local Mock Demo Verification](demo-verification.md).

## Create a Config

```bash
npx openvisi init
```

This creates `openvisi.config.json`.

If the file already exists and you want to recreate the starter config:

```bash
npx openvisi init --force
```

The starter config uses the `mock` provider and contains no API keys.

## Run the Full Demo Pipeline

```bash
npx openvisi scan --dry-run --provider mock --output openvisi-report

npx openvisi crawl --config openvisi.config.json --output openvisi-crawl --render-mode static

npx openvisi eval --provider mock --output openvisi-eval

npx openvisi inputs compose --crawl-output openvisi-crawl --eval-output openvisi-eval --output openvisi-measurement

npx openvisi metrics draft --measurement-output openvisi-measurement --output openvisi-metrics-draft

npx openvisi metrics review --metrics-draft-output openvisi-metrics-draft --output openvisi-metrics-review

npx openvisi metrics guard --metrics-review-output openvisi-metrics-review --output openvisi-metrics-finalization

npx openvisi debug report \
  --dry-run-output openvisi-report \
  --crawl-output openvisi-crawl \
  --eval-output openvisi-eval \
  --measurement-output openvisi-measurement \
  --metrics-draft-output openvisi-metrics-draft \
  --metrics-review-output openvisi-metrics-review \
  --metrics-finalization-output openvisi-metrics-finalization \
  --output openvisi-debug-report
```

## Expected Output Directories

```text
openvisi-report/
openvisi-crawl/
openvisi-eval/
openvisi-measurement/
openvisi-metrics-draft/
openvisi-metrics-review/
openvisi-metrics-finalization/
openvisi-debug-report/
```

These are runtime directories and should stay untracked.

## Inspect Artifact Bundles

```bash
npx openvisi artifacts inspect --output openvisi-report --stage dry-run
npx openvisi artifacts inspect --output openvisi-crawl --stage static-crawl
npx openvisi artifacts inspect --output openvisi-eval --stage evaluation
npx openvisi artifacts inspect --output openvisi-measurement --stage measurement-inputs
npx openvisi artifacts inspect --output openvisi-metrics-draft --stage metrics-draft
npx openvisi artifacts inspect --output openvisi-metrics-review --stage metrics-review
npx openvisi artifacts inspect --output openvisi-metrics-finalization --stage metrics-finalization
npx openvisi artifacts inspect --output openvisi-debug-report --stage debug-report
```

## Open the Debug Report

```bash
open openvisi-debug-report/debug-report.md
```

The debug report is a pipeline explanation. It is not a final AI Visibility report and does not compute a final AI Visibility Score.

## Troubleshooting

If you see:

```text
ENOENT: no such file or directory, open '.../openvisi.config.json'
```

run:

```bash
npx openvisi init
```

If `npx openvisi` does not resolve before build, run:

```bash
npm run build
```

Then retry the command.
