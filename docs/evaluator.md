# OpenVisi Evaluator

Stage 3A defines provider-agnostic evaluator contracts and a deterministic mock provider.

Stage 3B adds CLI artifact output for mock evaluation.

Stage 3C adds evaluator-derived answer signal input artifacts.

OpenVisi remains an open-source measurement layer for AI Visibility. This stage prepares answer collection boundaries without calling real LLM providers.

## Contracts

Evaluator contracts live in `packages/core`:

- `GenerateAnswerInput`
- `GenerateAnswerOptions`
- `LLMProviderAdapter`
- `EvaluatorRunInput`
- `EvaluatorRunResult`
- `AnswersArtifact`
- `validateAnswersArtifactShape`

The evaluator package imports these contracts from `@openvisi/core`.

## Mock Provider

`@openvisi/evaluator` currently implements only:

```ts
createMockProvider()
```

The mock provider:

- uses provider name `mock`
- defaults to model `mock-v0`
- returns deterministic `LLMAnswer` objects
- marks raw output with `mock: true`
- does not call real provider APIs
- does not require API keys

The mock output is for contract testing only. It is not real LLM output.

## Answers Artifact

`answers.json` is an evaluation artifact containing `LLMAnswer[]` inside an `AnswersArtifact` wrapper.

Stage 3B makes `openvisi eval` write `answers.json`.

`openvisi scan`, `openvisi crawl`, and `openvisi scan --dry-run` still do not write `answers.json`.

`answers.json` is not `metrics.json`.

`answers.json` is not `scan-result.json`.

The evaluator does not compute AI Visibility metrics, answer presence, citation coverage, competitor displacement, or `aiVisibilityScore`.

## Answer Signal Inputs

`openvisi eval` also writes:

```text
answer-signal-inputs.json
```

This artifact is derived from `answers.json`, `prompt-pack.json`, and `config.normalized.json`.

It summarizes transparent evaluator-side inputs:

- target brand mentions
- category, domain, and audience term signals
- citation counts from `LLMAnswer.citations`
- target domain citations from `LLMAnswer.citations`
- competitor mentions from configured competitor names and aliases
- mock-answer markers
- prompt-level signal results

It is not `metrics.json`.

It is not a final AI Visibility measurement.

With the mock provider, all answer signals are based on deterministic mock answers.

## CLI Usage

```bash
npx openvisi eval --provider mock --output openvisi-report
```

Stage 3B supports only `--provider mock`.

If `--provider openai`, `--provider anthropic`, `--provider google`, or `--provider custom` is used, the CLI fails with a clear unsupported-provider message.

No API keys are required or read.

The generated mock answers clearly indicate they are mock output and should not be treated as real LLM output.

## Provider Placeholders

The provider name union includes `openai`, `anthropic`, `google`, and `custom` as future adapter targets.

Stage 3B still implements only the deterministic mock provider.
