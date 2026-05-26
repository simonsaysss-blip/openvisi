# High-trust Markets Need Machine-readable Trust

OpenVisi ran a small crawl-diagnostic scan across MasterControl, Veeva, and
DocuSign on May 26, 2026.

The question was not which company is better. The question was whether
high-trust SaaS categories expose source structures that machines can parse,
classify, and cite.

## The Signal

| Domain            | AI Visibility Score | Entity Clarity | Citation Coverage Proxy |
| ----------------- | ------------------- | -------------- | ----------------------- |
| veeva.com         | 67                  | 0.95           | 0.93                    |
| docusign.com      | 61                  | 0.85           | 0.75                    |
| mastercontrol.com | 54                  | 0.77           | 0.75                    |

Regulated SaaS performed well because these websites often publish industry,
compliance, validation, product-category, and trust context.

## The Category Lesson

For regulated markets, trust cannot live only in sales decks, PDFs, or brand
reputation. It needs to be machine-readable.

Machine-readable Trust includes source freshness, organization clarity,
documentation depth, official source consistency, third-party references, and
structured data.

## The Gap

The recurring gaps were explicit schema and structured evidence signals. That is
important because AI-generated answers often need stable source anchors when
summarizing high-stakes categories.

## Measurement Boundary

OpenVisi used `crawl-diagnostic-v0.1`. It did not run live provider-backed
answer scans or measure proprietary AI behavior.

## Related Report

See `benchmarks/field-tests/v0.1/regulated-saas.md`.
