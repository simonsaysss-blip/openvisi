# OpenVisi Prompt Packs

A prompt pack is a documented set of prompts used to measure AI Visibility for a
specific entity, category, or benchmark.

Prompt packs make scans reproducible because they define what was asked, when it
was asked, and which visibility dimensions the prompts were designed to test.

## Prompt Categories

- Category discovery prompts
- Alternative/comparison prompts
- Problem-solution prompts
- Brand-specific prompts
- Integration prompts
- Buyer-intent prompts

## How OpenVisi Uses Prompt Packs

Each prompt should map to one or more metrics, such as `answerPresence`,
`answerShare`, `citationCoverage`, `competitorDisplacement`, or
`comparisonVisibility`.

Prompt packs should include enough context for another maintainer to rerun the
same scan and understand the expected measurement surface.

## Guardrails

Prompt packs should not be used to claim stable rankings inside proprietary AI
products. They are reproducibility scaffolding for visibility diagnostics and
benchmarks.
