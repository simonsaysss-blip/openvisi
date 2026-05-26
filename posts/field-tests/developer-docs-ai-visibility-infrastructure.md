# Developer Docs Are Becoming AI Visibility Infrastructure

OpenVisi ran a small crawl-diagnostic scan across Vercel, Stripe, and Supabase
on May 26, 2026.

This was not a ranking and not a live LLM benchmark. It was a source-layer scan:
what does a lightweight crawler see, and how does that map to AI Visibility
vocabulary?

## The Signal

Developer tools scored strongly on crawl-visible Entity Clarity and Citation
Coverage proxies.

| Domain       | AI Visibility Score | Entity Clarity | Citation Coverage Proxy |
| ------------ | ------------------- | -------------- | ----------------------- |
| stripe.com   | 69                  | 0.95           | 0.93                    |
| vercel.com   | 67                  | 0.85           | 0.75                    |
| supabase.com | 58                  | 0.77           | 0.66                    |

The pattern makes sense. Developer platforms usually publish docs, integration
pages, product explanations, changelogs, APIs, and category language.

That public source layer is not just documentation. It is AI Visibility
infrastructure.

## The Gap

The recurring weakness was not basic product clarity. It was explicit
machine-readable trust: Organization schema, key schema.org types, FAQ
structure, source freshness, and citation-ready evidence pages.

## Why This Matters

LLM-powered discovery needs source material that can be parsed, classified, and
cited. Developer docs are unusually well-positioned for that surface because
they already encode how the product works.

The next step is making that structure more explicit.

## Measurement Boundary

OpenVisi used `crawl-diagnostic-v0.1`. It did not collect live AI-generated
answers. Fields such as `answerShare` and `competitorDisplacement` remain null
until provider-backed prompt packs are run.

## Related Report

See `benchmarks/field-tests/v0.1/developer-tools.md`.
