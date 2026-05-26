# OpenVisi Cross-domain Field Test: What We Learned

OpenVisi ran 15 crawl-diagnostic scans across five verticals on May 26, 2026:
developer tools, AI products, education, commerce platforms, and regulated SaaS.

This was not a ranking. It was a test of whether OpenVisi's AI Visibility
vocabulary can explain different public source layers across different markets.

## Average Results

| Vertical           | Avg AI Visibility Score | Avg Entity Clarity | Avg Citation Coverage Proxy |
| ------------------ | ----------------------- | ------------------ | --------------------------- |
| Developer tools    | 64.67                   | 0.86               | 0.78                        |
| Regulated SaaS     | 60.67                   | 0.86               | 0.81                        |
| Commerce platforms | 51.33                   | 0.64               | 0.65                        |
| Education          | 48.33                   | 0.52               | 0.45                        |
| AI products        | 36.00                   | 0.39               | 0.42                        |

## What Resonated

Developer tools and regulated SaaS produced the strongest early fit.

Developer tools already understand documentation, APIs, source structure, and
integration pages.

Regulated SaaS already understands trust, evidence, compliance, and source
authority.

Those are natural entry points for OpenVisi.

## What Was Surprising

AI products produced the most interesting contrast. AI-native brand awareness
does not automatically mean the public homepage is AI-readable to a lightweight
crawler.

That makes the category interesting, but also easy to overstate. The right claim
is source-layer measurement, not answer-engine behavior.

## What Comes Next

The next methodology step is provider-backed prompt packs. That is where fields
such as `answerShare`, `competitorDisplacement`, `officialSourceCitationRate`,
and `comparisonVisibility` move from `null` to measured.

Until then, OpenVisi should keep making the source layer measurable,
explainable, and reproducible.

## Related Report

See `benchmarks/field-tests/v0.1/README.md`.
