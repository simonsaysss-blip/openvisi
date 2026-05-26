# OpenVisi Methodology

OpenVisi evaluates public website signals that may affect how clearly a site can be read, summarized, cited, and interpreted by LLM-powered discovery systems.

The current methodology is intentionally conservative. The score is an early diagnostic signal for machine-readable visibility structure, not a definitive ranking model.

Current methodology version: `0.1`

## What OpenVisi Evaluates

OpenVisi currently starts from a target URL, crawls a small set of same-origin pages, extracts page metadata and visible text, and evaluates explainable signals across six categories:

- Entity Clarity
- Technical Discoverability
- Structured Data
- Content Chunkability
- Citation Readiness
- Prompt Simulation

Each category returns:

- `score`: a directional 0-100 category score
- `maturity`: current confidence in the analyzer's methodological stability
- `detectedSignals`: public signals that contributed useful evidence
- `missingSignals`: absent or weak signals surfaced by the analyzer
- `interpretation`: a short diagnostic explanation of the score and maturity level
- `suggestedStructuralImprovements`: low-level structural improvements derived from detected gaps
- `issues`: detected weaknesses with severity
- `recommendations`: practical next steps
- `evidence`: observable signals from the crawl

## Evidence-Based Diagnostics

OpenVisi reports are designed to answer why a score happened, not just show the score.

For each analyzer, the report exposes:

- detected signals, such as titles, H1s, schema types, FAQ-like content, or freshness markers
- missing signals, such as absent schema, weak metadata, thin content, or missing trust pages
- a diagnostic interpretation that states how to read the score
- suggested structural improvements tied to observed gaps

These fields are derived from crawl evidence and analyzer issues. They are not model-generated claims and do not imply that a specific LLM product will cite or recommend the site.

## Methodology Versioning

OpenVisi reports include a visible `methodologyVersion` field. Version `0.1` indicates the current early diagnostic methodology:

- lightweight crawl evidence
- heuristic scoring
- analyzer maturity labels
- no provider-backed LLM interpretation checks
- no claim of ranking or citation prediction

Future methodology changes should update documentation and curated examples alongside code changes.

## Score Interpretation

The AI Visibility Score should be read as a directional snapshot of the site's machine-readable visibility structure at scan time.

Suggested interpretation:

- `80-100`: strong public signals, though still not proof of LLM citation or recommendation behavior
- `60-79`: useful structure with identifiable gaps
- `40-59`: partial visibility structure that likely needs clearer metadata, content, schema, or trust signals
- `0-39`: weak machine-readable structure or limited crawlable evidence

Scores should not be compared across sites without considering crawl depth, site type, content language, rendering behavior, and fixture coverage. A score is most useful when comparing repeat scans of the same site after documented changes.

## Analyzer Categories

Analyzer results include a maturity label:

- `stable`: behavior is expected to remain mostly compatible across minor changes
- `heuristic`: behavior is useful but depends on directional pattern checks and should be interpreted with caution
- `experimental`: behavior is scaffolded or early and should not be treated as a settled diagnostic signal

The current MVP mostly uses `heuristic` labels. Prompt Simulation is `experimental` because it does not run provider-backed checks.

### Entity Clarity

Entity Clarity checks whether the site makes its identity easy to understand. Current checks include title and H1 signals, descriptive meta copy, business type language, service or product descriptions, location or service-area hints, target audience language, contact signals, and Organization or LocalBusiness schema.

### Technical Discoverability

Technical Discoverability checks whether public crawlers can discover and interpret key pages. Current checks include `robots.txt`, `sitemap.xml`, `llms.txt`, canonical links, meta descriptions, Open Graph metadata, JSON-LD coverage, and successful crawl status.

### Structured Data

Structured Data checks whether pages expose machine-readable schema.org data. Current checks look for relevant schema types such as Organization, LocalBusiness, Product, Service, FAQPage, BreadcrumbList, Article, Course, and EducationalOrganization.

### Content Chunkability

Content Chunkability checks whether pages contain enough crawlable text and heading structure for downstream retrieval and summarization. Current checks include H1/H2 coverage, FAQ-like content, definition-style paragraphs, thin-page warnings, and text-to-visual ratio warnings.

### Citation Readiness

Citation Readiness checks whether pages contain signals that make factual claims easier to verify and cite. Current checks include author or freshness signals, external references, clear factual claim patterns, evidence or resource pages, About/Contact pages, and trust signals.

### Prompt Simulation

Prompt Simulation is currently a placeholder category. The MVP does not call LLM provider APIs and does not compare model answers against crawl evidence. Provider-backed simulation may be added later as an optional bring-your-own-key workflow.

## AI Visibility Score

The AI Visibility Score is a weighted summary of the category scores. It is meant to help teams identify likely weaknesses in AI-readable website structure.

Current weights:

- Entity Clarity: 25%
- Technical Discoverability: 20%
- Structured Data: 20%
- Content Chunkability: 15%
- Citation Readiness: 10%
- Prompt Simulation: 10%

These weights are provisional and may change as fixtures, benchmarks, and community feedback improve the methodology.

## Signal Weighting Philosophy

The current weights emphasize explicit machine-readable structure over speculative model behavior.

- Entity Clarity and Structured Data receive high weight because they provide direct identity and fact signals.
- Technical Discoverability receives high weight because crawl access, canonical URLs, metadata, and JSON-LD coverage affect whether evidence can be collected.
- Content Chunkability is weighted as a retrieval and summarization signal, not as a content-quality score.
- Citation Readiness is weighted as a trust and evidence signal.
- Prompt Simulation is intentionally limited because provider-backed interpretation checks are not implemented in the MVP.

Weights are not calibrated against proprietary LLM systems. They are starting assumptions for transparent diagnostics and future fixture validation.

## Confidence Considerations

OpenVisi reports should be treated with different confidence levels depending on the evidence available.

Higher confidence:

- pages return successful HTTP status codes
- important pages are discoverable from sitemap or internal links
- visible text is available in the fetched HTML
- JSON-LD, canonical links, and metadata are explicit
- findings are supported by multiple pages

Lower confidence:

- content is mostly rendered client-side after page load
- crawl depth is low
- pages are blocked, redirected, or non-HTML
- evidence appears only in images or scripts
- the site has multilingual content that pattern checks do not fully cover

OpenVisi does not currently compute a separate confidence score, but confidence notes will be part of future methodology hardening.

## Fixture-Based Validation

OpenVisi uses small synthetic fixtures to validate directional analyzer behavior.

Current fixture intent:

- `strong-entity-site`: should show stronger entity clarity than a vague site
- `weak-entity-site`: should expose missing machine-readable and entity signals
- `faq-heavy-site`: should show stronger content chunkability or citation-readiness signals than a thin page

Fixture validation checks signal behavior, not real-world LLM ranking outcomes. The goal is to catch regressions in methodology explanations and directional scoring, not to prove that a score predicts citations or recommendations.

## Directional Test Philosophy

Fixture tests should prefer:

- `score A > score B`
- `detectedSignals` includes an expected strength
- `missingSignals` includes an expected weakness

Fixture tests should avoid:

- brittle exact-score assertions
- claims that a fixture represents an entire market category
- conclusions about proprietary LLM behavior

## Limits of Fixture Validation

Fixtures are intentionally small and synthetic. They help validate analyzer consistency, but they do not replace:

- larger public benchmark datasets
- multilingual examples
- JavaScript-rendered website checks
- accessibility review
- human editorial review
- provider-backed interpretation checks, if those are added later

## What OpenVisi Does Not Claim

OpenVisi does not currently claim to:

- predict rankings in ChatGPT, Claude, Gemini, Perplexity, or any other AI product
- guarantee citations, recommendations, or answer inclusion
- measure private model behavior
- manipulate AI search results
- replace accessibility work, documentation review, content design, or technical site maintenance

OpenVisi measures public, explainable signals that describe how readable, citeable, and machine-readable a website appears from a lightweight crawl snapshot.

## Current Limitations

- The crawler is intentionally lightweight and may miss content rendered only after complex client-side JavaScript execution.
- The scoring model is heuristic and directional.
- Scans are snapshots and may change as the website, crawl path, or HTTP behavior changes.
- The sample size is limited by crawl depth and discovery rules.
- Some checks rely on pattern matching and may produce false positives or false negatives.
- Prompt simulation does not run provider-backed evaluation yet.
- The methodology has not yet been validated against a large public benchmark dataset.

## Non-Goals

OpenVisi is not trying to provide:

- AI search ranking prediction
- citation guarantees
- real-time monitoring of proprietary LLM answers
- growth-hacking recommendations
- automated content generation
- private model evaluation without explicit provider integration
- a replacement for human editorial, documentation, or accessibility review

## Methodology Roadmap

Planned improvements:

- document each scoring rule with examples
- add fixture-based regression tests for analyzer behavior
- add repeatable benchmark datasets across OSS documentation, product documentation, education sites, and content-heavy documentation
- add comparative snapshots for repeated scans of the same target
- separate evidence collection from scoring explanations more clearly
- add optional provider-backed interpretation checks with explicit limitations
- publish methodology changes alongside versioned examples
