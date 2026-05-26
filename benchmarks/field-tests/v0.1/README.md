# OpenVisi Field Tests v0.1

This folder contains small cross-domain OpenVisi crawl-diagnostic snapshots used
to test whether the AI Visibility vocabulary works across different markets.

These are not rankings, traffic studies, or live LLM answer benchmarks.

## Measurement Boundary

Scan date: May 26, 2026

Measurement mode: `crawl-diagnostic-v0.1`

Command pattern:

```bash
npm run cli -- scan <url> --max-pages 2 --timeout-ms 10000 -o /private/tmp/openvisi-field-tests/<vertical>
```

OpenVisi did not run provider-backed answer scans. Fields such as `answerShare`,
`competitorDisplacement`, `officialSourceCitationRate`, and
`comparisonVisibility` remained `null` because they require prompt packs and
answer collection.

## Verticals Tested

- Developer tools: Vercel, Stripe, Supabase
- AI products: OpenAI, Anthropic, Perplexity
- Education: Coursera, Khan Academy, Duolingo
- Commerce platforms: Shopify, Amazon, Etsy
- Regulated SaaS: MasterControl, Veeva, DocuSign

## Cross-domain Averages

| Vertical           | Sites | Avg AI Visibility Score | Avg Answer Presence Proxy | Avg Entity Clarity | Avg Citation Coverage Proxy | Avg Machine-readable Trust Proxy | Avg AI Citation Signals Proxy |
| ------------------ | ----- | ----------------------- | ------------------------- | ------------------ | --------------------------- | -------------------------------- | ----------------------------- |
| Developer tools    | 3     | 64.67                   | 0.82                      | 0.86               | 0.78                        | 0.44                             | 0.59                          |
| Regulated SaaS     | 3     | 60.67                   | 0.73                      | 0.86               | 0.81                        | 0.45                             | 0.55                          |
| Commerce platforms | 3     | 51.33                   | 0.62                      | 0.64               | 0.65                        | 0.37                             | 0.47                          |
| Education          | 3     | 48.33                   | 0.61                      | 0.52               | 0.45                        | 0.27                             | 0.47                          |
| AI products        | 3     | 36.00                   | 0.41                      | 0.39               | 0.42                        | 0.26                             | 0.34                          |

## Interpretation

Developer tools and regulated SaaS produced the strongest early fit for the
OpenVisi vocabulary. Both categories tend to have clearer product/category
language, deeper documentation or trust pages, and more crawl-visible source
material.

AI products produced the most interesting contrast. The category is highly
visible culturally, but some public homepages exposed thin crawl-visible entity
and source structure to the lightweight scanner. This is not a claim about their
actual presence in AI-generated answers.

Education and commerce platforms were mixed. Some sites looked highly
AI-readable in the crawl-visible layer, while others exposed limited public
structure or homepage content under the current crawler settings.

## Strategic Signal

The strongest near-term OpenVisi content angles are:

- Developer tools: "Docs and developer platforms are naturally AI-readable, but
  still miss explicit trust/schema signals."
- Regulated SaaS: "High-trust markets need Machine-readable Trust, not just
  brand credibility."
- AI products: "AI-native companies are not automatically AI-readable at the
  public source layer."
- Education: "Learning platforms need entity and course-category clarity for
  AI-generated answers."
- Commerce platforms: "Marketplace popularity and source-layer clarity are
  separate measurement surfaces."

## Limits

- Sample size is intentionally small.
- Results are directional and should not be used as vendor rankings.
- Scores depend on crawl depth, public homepage behavior, redirects, and
  rendering behavior.
- OpenVisi v0.1 does not infer proprietary LLM behavior.
- Provider-backed answer metrics require prompt packs and repeatable collection.
