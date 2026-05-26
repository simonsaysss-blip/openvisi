# The OpenVisi AI Visibility Benchmark Preview

Measuring Answer Presence, Entity Clarity, Citation Coverage, and Competitor
Displacement across LLM-powered search surfaces.

This preview defines the shape of a future benchmark. It does not contain
collected benchmark results yet.

## Purpose

The benchmark preview exists to make methodology inspectable before results are
published. It defines the vocabulary, fields, prompt categories, limitations, and
report structure that a future benchmark should use.

## Measurement Layers

- Presence Layer: Answer Presence, Mention Rate, Prompt Coverage, Answer Share.
- Accuracy Layer: Narrative Accuracy, Entity Clarity, Positioning Accuracy,
  Product Understanding.
- Citation Layer: Citation Coverage, Official Source Citation Rate, Third-party
  Source Reliance, AI Citation Signals.
- Competitive Layer: Competitor Displacement, Category Share, Alternative
  Recommendation Rate, Comparison Visibility.

## Required Benchmark Metadata

- benchmark title
- benchmark subtitle
- methodology version
- measurement date
- prompt pack version
- target entities
- inclusion criteria
- model or answer surface, if provider-backed scans are used
- limitations
- raw answer retention policy

## Required Report Sections

1. AI Visibility Score
2. Answer Presence
3. Entity Clarity
4. Citation Coverage
5. AI Citation Signals
6. Competitor Displacement
7. AI-readable Structure
8. Machine-readable Trust
9. Source Gaps
10. Recommended Fixes

## Interpretation Guardrails

- The preview is not a ranking dataset.
- Early metrics should be interpreted directionally.
- AI answers are probabilistic and can vary by model, surface, and time.
- Citation behavior is surface-dependent.
- OpenVisi should not claim to predict proprietary AI answer inclusion.

## Canonical Links

- `docs/glossary.md`
- `docs/methodology/measurement-model.md`
- `docs/methodology/metrics.md`
- `docs/methodology/prompt-packs.md`
- `docs/methodology/limitations.md`
- `examples/demo-report.md`
