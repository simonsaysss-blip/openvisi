# AI Companies Are Not Automatically AI-readable

OpenVisi ran a small crawl-diagnostic scan across OpenAI, Anthropic, and
Perplexity on May 26, 2026.

This is the most sensitive category in the series, so the measurement boundary
matters: this was not a live LLM benchmark, not a brand-strength study, and not
a claim about how AI systems internally rank these entities.

It was a crawl-visible source-layer scan.

## The Signal

| Domain        | AI Visibility Score | Entity Clarity | Citation Coverage Proxy |
| ------------- | ------------------- | -------------- | ----------------------- |
| anthropic.com | 56                  | 0.77           | 0.66                    |
| perplexity.ai | 27                  | 0.25           | 0.30                    |
| openai.com    | 25                  | 0.15           | 0.30                    |

The takeaway is not that any AI company has low real-world visibility. The
takeaway is that AI-native brand familiarity and AI-readable public source
structure are separate surfaces.

## Why This Is Useful

AI Visibility needs vocabulary that separates:

- cultural presence
- crawl-visible entity clarity
- citation-ready source structure
- provider-backed answer behavior

OpenVisi v0.1 currently measures the source layer, not the answer layer.

## Follow-up

This category needs path-specific scans across docs, research, safety, model,
and product pages before any stronger claim can be made.

## Related Report

See `benchmarks/field-tests/v0.1/ai-products.md`.
