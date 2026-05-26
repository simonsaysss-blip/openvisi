# We Scanned Popular Websites with OpenVisi. Popular Does Not Mean AI-readable.

On May 26, 2026, we used OpenVisi to run a small crawl-diagnostic scan across a
sample of globally popular websites.

The target set was selected from public high-traffic website ranking context,
including Similarweb's global top websites page, which was last updated on May
1, 2026. This is not a traffic ranking and should not be read as a benchmark of
which company is "better."

The goal was narrower: inspect what a lightweight crawler can see from each
site's public source layer, then map that evidence into OpenVisi's canonical AI
Visibility vocabulary.

## What OpenVisi Measured

OpenVisi did not run live ChatGPT, Gemini, Claude, Perplexity, or other
provider-backed answer scans.

This scan measured crawl-visible diagnostics:

- Entity Clarity
- Citation Coverage proxy
- Machine-readable Trust proxy
- AI Citation Signals proxy
- crawlable pages
- missing structural signals

Fields such as `answerShare`, `competitorDisplacement`,
`officialSourceCitationRate`, and `comparisonVisibility` remain `null` because
they require provider-backed answer collection and prompt packs.

## Scan Setup

Command pattern:

```bash
npm run cli -- scan <url> --max-pages 2 --timeout-ms 10000 -o /private/tmp/openvisi-hot-scans
```

Targets:

- `https://www.google.com`
- `https://www.youtube.com`
- `https://www.facebook.com`
- `https://www.instagram.com`
- `https://chatgpt.com`
- `https://www.wikipedia.org`

## Results Snapshot

| Domain        | AI Visibility Score | Answer Presence Proxy | Entity Clarity | Citation Coverage Proxy | Machine-readable Trust Proxy | AI Citation Signals Proxy | Crawled Pages |
| ------------- | ------------------- | --------------------- | -------------- | ----------------------- | ---------------------------- | ------------------------- | ------------- |
| wikipedia.org | 49                  | 0.57                  | 0.67           | 0.75                    | 0.42                         | 0.42                      | 2             |
| google.com    | 45                  | 0.53                  | 0.45           | 0.62                    | 0.36                         | 0.46                      | 2             |
| youtube.com   | 44                  | 0.52                  | 0.45           | 0.62                    | 0.36                         | 0.45                      | 2             |
| facebook.com  | 26                  | 0.30                  | 0.15           | 0.15                    | 0.13                         | 0.25                      | 0             |
| instagram.com | 26                  | 0.30                  | 0.15           | 0.15                    | 0.13                         | 0.25                      | 0             |
| chatgpt.com   | 20                  | 0.21                  | 0.15           | 0.15                    | 0.13                         | 0.16                      | 1             |

## The Pattern

The most useful finding is not the score order.

The useful finding is that popularity and AI-readable structure are different
things.

A site can be massively popular and still expose a thin crawl-visible source
layer on its public homepage. For humans, brand recognition fills the gap. For
machines, the source layer still needs explicit structure: titles, headings,
entity definitions, schema, canonical pages, documentation depth, and citation
ready source material.

## Wikipedia Looked Different

Wikipedia had the strongest Entity Clarity and Citation Coverage proxy in this
small sample.

That is not surprising. Wikipedia's public surface is built around structured
explanation, dense internal linking, and citeable text. It is not just a brand
destination. It is a source layer.

For AI Visibility, that distinction matters.

## Google and YouTube Were Crawl-visible, But Sparse

Google and YouTube returned crawlable pages and enough public structure to score
above the more locked-down consumer platforms.

But the scans still surfaced missing or weak machine-readable signals such as
homepage H1 clarity, organization schema, and structured data coverage.

This does not mean these brands lack real-world AI Visibility. It means the
lightweight crawl-visible layer does not expose the same kind of explicit source
structure that OpenVisi is designed to inspect.

## Facebook and Instagram Were Mostly Non-crawlable in This Snapshot

Facebook and Instagram returned useful asset signals such as `robots.txt`,
`sitemap.xml`, and `llms.txt`, but the scan collected zero crawlable content
pages under the current lightweight crawler settings.

That is a measurement finding, not a brand judgment.

For OpenVisi, zero crawlable pages means the report must be cautious. It can
detect missing source-layer evidence, but it should not pretend to know how
these platforms perform inside AI-generated answers.

## ChatGPT Exposed a Thin Public Source Layer

ChatGPT was the most interesting result because it is itself an AI-era product.

The scan found a low crawl-diagnostic score because the public homepage exposed
limited title, heading, schema, and citation-ready structure to the lightweight
crawler.

Again, this is not a claim that ChatGPT lacks AI Visibility. It is a reminder
that product popularity, brand familiarity, and crawl-visible source clarity are
separate measurement surfaces.

## What This Means for OpenVisi

This scan supports the core OpenVisi position:

AI Visibility needs a measurement language that separates presence, accuracy,
citation, and competition.

The crawl-visible source layer is only one part of that system, but it is a
necessary foundation. If a site does not expose clear public source material,
answer engines have fewer explicit facts to parse, classify, and cite.

## What This Does Not Prove

This post does not prove:

- which website appears most often in AI answers
- which website is cited most often by a specific AI product
- which website has the strongest brand
- which website should rank first in any benchmark
- how proprietary AI systems internally interpret these entities

Those questions require provider-backed prompt packs, answer collection, source
classification, and repeatable benchmark methodology.

## The Takeaway

Popular websites are not automatically AI-readable.

AI-readable Structure is a separate surface. It has to be measured with its own
vocabulary, schema, methodology, and report format.

That is the layer OpenVisi is building.

## Source and Reproducibility Notes

Target-selection context:

- Similarweb Top Websites Ranking: `https://www.similarweb.com/top-websites/`

Scan date:

- May 26, 2026

OpenVisi measurement mode:

- `crawl-diagnostic-v0.1`

Local output path:

- `/private/tmp/openvisi-hot-scans`
