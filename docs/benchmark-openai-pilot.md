# OpenAI Benchmark Pilot

OpenVisi Benchmark Harness v0.1 can run an explicit OpenAI provider pilot for flat-file benchmark runs.

This is separate from the mock-only RC artifact pipeline. It does not create a SaaS product, dashboard, production monitoring workflow, final AI Visibility Score, or final report.

## What It Does

- Reads `OPENAI_API_KEY` from the environment or a local `.env` file.
- Uses the OpenAI Responses API for benchmark probes.
- Runs `grounded` mode with the Responses API `web_search` tool required.
- Runs `parametric` mode without web search tools.
- Saves raw response text, token usage when available, citations, web search call metadata, and raw provider metadata to `runs/{runId}/raw/responses.jsonl`.
- Saves evidence gate metadata that records whether grounded probes observed web search calls and provider-backed citations.
- Keeps grounded and parametric results separated during scoring.

## What It Does Not Do

- It does not implement judge scoring.
- It does not implement retries.
- It does not call Anthropic or Gemini.
- It does not compute a final AI Visibility Score.
- It does not publish a production benchmark claim.

## Example Config

Copy the example config and adjust the model ID before running if needed:

```bash
cp bench.openai.example.config.json bench.openai.config.json
```

Set your key locally:

```bash
OPENAI_API_KEY=... npx openvisi run --config bench.openai.config.json
```

Then score, report, and estimate cost:

```bash
npx openvisi score --run pharma-qms-ai-visibility-benchmark-2026
npx openvisi report --run pharma-qms-ai-visibility-benchmark-2026
npx openvisi cost --run pharma-qms-ai-visibility-benchmark-2026
```

If pricing for the selected model is not present in `specs/pricing.json`, the cost report shows `unknown` instead of guessing. Keep pricing data under your own release and billing review process.

## Interpretation

The OpenAI pilot is useful for small controlled measurement rehearsals. Treat the output as auditable benchmark evidence, not as a final market claim.

Before publishing any benchmark result, review:

- prompt pack scope
- target list
- model IDs
- date label
- sample count
- grounded versus parametric split
- citation extraction quality
- evidence gate status
- cost report completeness
- known provider limitations
