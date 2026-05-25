# OpenVisi Methodology

OpenVisi evaluates public website signals that may affect how clearly a site can be read, summarized, cited, and recommended by LLM-powered discovery systems.

The current methodology is intentionally conservative. The score is an early diagnostic signal, not a definitive ranking model.

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
- `issues`: detected weaknesses with severity
- `recommendations`: practical next steps
- `evidence`: observable signals from the crawl

## Analyzer Categories

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

## What OpenVisi Does Not Claim

OpenVisi does not currently claim to:

- predict rankings in ChatGPT, Claude, Gemini, Perplexity, or any other AI product
- guarantee citations, recommendations, or answer inclusion
- measure private model behavior
- manipulate AI search results
- replace technical SEO, content strategy, accessibility work, or documentation review

OpenVisi measures public, explainable signals that may improve how readable and citeable a website is.

## Current Limitations

- The crawler is intentionally lightweight and may miss content rendered only after complex client-side JavaScript execution.
- The scoring model is heuristic and directional.
- The sample size is limited by crawl depth and discovery rules.
- Some checks rely on pattern matching and may produce false positives or false negatives.
- Prompt simulation does not run provider-backed evaluation yet.
- The methodology has not yet been validated against a large public benchmark set.

## Methodology Roadmap

Planned improvements:

- document each scoring rule with examples
- add fixture-based regression tests for analyzer behavior
- add benchmark examples across OSS documentation, SaaS sites, education sites, and content-heavy documentation
- separate evidence collection from scoring explanations more clearly
- add optional provider-backed prompt simulation with explicit limitations
- publish methodology changes alongside versioned examples
