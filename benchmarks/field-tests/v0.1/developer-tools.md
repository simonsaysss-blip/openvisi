# Developer Tools Field Test

Scan date: May 26, 2026

Measurement mode: `crawl-diagnostic-v0.1`

Targets: Vercel, Stripe, Supabase.

## Results

| Domain       | AI Visibility Score | Answer Presence Proxy | Entity Clarity | Citation Coverage Proxy | Machine-readable Trust Proxy | AI Citation Signals Proxy |
| ------------ | ------------------- | --------------------- | -------------- | ----------------------- | ---------------------------- | ------------------------- |
| stripe.com   | 69                  | 0.88                  | 0.95           | 0.93                    | 0.52                         | 0.62                      |
| vercel.com   | 67                  | 0.86                  | 0.85           | 0.75                    | 0.42                         | 0.61                      |
| supabase.com | 58                  | 0.72                  | 0.77           | 0.66                    | 0.38                         | 0.54                      |

## Readout

Developer tools are a strong fit for the OpenVisi vocabulary because they often
publish documentation, integration pages, product definitions, and clear
developer-facing category language.

The recurring gap was not basic clarity. It was explicit machine-readable trust:
Organization schema, key schema.org types, FAQ structure, and source freshness
signals.

## Article Angle

Developer docs are becoming AI Visibility infrastructure.

## Follow-up Test

Run a deeper scan against docs subdomains and compare homepage-only results with
documentation-heavy crawl paths.
