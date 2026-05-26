# OpenVisi Roadmap

OpenVisi is an early-stage open-source measurement layer for AI Visibility.

AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.

## Completed Foundation

- Core AI Visibility vocabulary and metrics contracts.
- Scan config and prompt pack contracts.
- Static crawler snapshot adapter boundary.
- Artifact bundle manifest and reader.
- Golden artifact fixtures and contract regression tests.
- Deterministic mock evaluator.
- Structure/trust and answer signal input artifacts.
- Measurement input composition.
- Metrics draft, metrics review, and metrics finalization guard.
- Human-readable artifact debug report.
- Local mock demo verification with `npm run demo:mock`.

## Current Mock Demo Pipeline

The current demo pipeline is local and mock-only.

It produces artifact bundles for:

- dry-run planning
- static crawl evidence
- mock evaluation evidence
- measurement inputs
- metrics draft
- metrics review
- metrics finalization guard
- artifact debug report

No final AI Visibility Score is produced in the current mock pipeline.

`metrics.json` and `scan-result.json` are intentionally not generated.

## Next OSS Readiness

- Keep docs and examples aligned with the artifact pipeline.
- Improve contributor-facing issue and PR workflows.
- Keep CI npm-first and publicly verifiable.
- Expand fixture coverage without introducing fake final scoring.
- Continue hardening artifact contract tests.

## Future Real Provider Adapters

Real provider adapters are future work.

They should be:

- opt-in
- environment-variable based
- explicit about data flow
- covered by provider-agnostic contracts
- isolated from final metrics until evidence gates pass

OpenVisi should not read API keys or call real providers in the mock demo pipeline.

## Future Final Metrics

Final metrics require evidence gates.

A future final metrics stage must check:

- metrics review readiness
- metrics finalization status
- provider evidence mode
- narrative accuracy review requirements

Final `aiVisibilityScore` must not be computed while finalization is blocked.

## Future Reports

Future reports should consume validated artifact bundles.

Reports should distinguish:

- raw crawler evidence
- raw evaluator evidence
- input artifacts
- draft metrics
- reviewed metrics
- final metrics, if a future stage permits them

## Future Storage and Dashboard

Storage and dashboard work is future scope.

The current OSS core should remain local-first, artifact-first, and useful without SaaS infrastructure.
