# AI Visibility Audit Report

## Summary

- Target: https://example.com/
- Domain: example.com
- Generated at: 2026-05-25T01:46:03.934Z
- Crawled pages: 7
- Robots respected: yes
- AI Visibility Score: 34/100

## Scores

- Entity Clarity: 45/100 (weight 25%)
- Technical Discoverability: 12/100 (weight 20%)
- Structured Data: 10/100 (weight 20%)
- Content Chunkability: 54/100 (weight 15%)
- Citation Readiness: 48/100 (weight 10%)
- Prompt Simulation: 50/100 (weight 10%)

## Analyzer Details

### Entity Analyzer

- Score: 45/100
- Issues: 6
- Recommendations: 6

Evidence:
- Brand/title signal found: Example Domain
- Homepage H1 found: Example Domain
- Contact information or contact page discovered.


### Technical Analyzer

- Score: 12/100
- Issues: 7
- Recommendations: 7

Evidence:
- 1 of 7 crawled pages returned 2xx status.
- 0% coverage for canonical url coverage is low.
- 0% coverage for meta description coverage is low.
- 0% coverage for open graph coverage is low.
- 0% coverage for json-ld coverage is low.


### Structured Data Analyzer

- Score: 10/100
- Issues: 3
- Recommendations: 3

Evidence:
- 0% of crawled pages include JSON-LD.


### Content Analyzer

- Score: 54/100
- Issues: 1
- Recommendations: 1

Evidence:
- 100% of pages include an H1.
- 0% of pages include H2 sections.
- 0 pages have at least 800 visible text characters.
- FAQ-like content discovered.
- 0 pages include definition-style explanatory paragraphs.
- No severe text-to-visual ratio warning detected.


### Citation Readiness Analyzer

- Score: 48/100
- Issues: 3
- Recommendations: 3

Evidence:
- 7 pages include external references.
- About/contact trust pages are available.


## Critical Issues

1. **[high] Organization-level schema is missing**
   Without Organization or LocalBusiness schema, LLMs have fewer explicit entity signals.
   Evidence: Add Organization or LocalBusiness JSON-LD with name, URL, logo, sameAs, and contact.
2. **[high] sitemap.xml was not found**
   Sitemaps help AI and search crawlers discover canonical pages.
   Evidence: Publish an XML sitemap with canonical URLs for important pages.
3. **[high] No key schema.org types were detected**
   Structured data gives AI systems explicit facts about the site entity and content.
   Evidence: Add relevant JSON-LD such as Organization, Service, Product, FAQPage, or Article.
4. **[high] Entity schema is missing**
   Organization or LocalBusiness schema is the strongest machine-readable entity anchor.
   Evidence: Add Organization or LocalBusiness schema to the homepage.
5. **[medium] Homepage meta description is missing or too thin**
   AI systems need concise brand descriptions to identify what the organization does.
   Evidence: Write a direct description with brand, business type, audience, location, and services.
6. **[medium] Business type is not explicit**
   LLMs need a category label before they can compare or recommend a site.
   Evidence: State the business type clearly, such as open-source toolkit, school, SaaS, or platform.
7. **[medium] Service description is weak**
   AI answer engines need compact explanations of what the site offers.
   Evidence: Add a short service overview and dedicated service pages.
8. **[medium] Target audience is unclear**
   LLMs need audience labels to decide when a recommendation is relevant.
   Evidence: Add explicit audience copy such as developers, maintainers, marketers, or parents.
9. **[medium] robots.txt was not found**
   Robots directives help crawlers understand access policy.
   Evidence: Publish a clear robots.txt and include a Sitemap directive.
10. **[medium] Canonical URL coverage is low**
   Canonical links reduce ambiguity when AI crawlers consolidate pages.
   Evidence: Add canonical links to important indexable pages.

## Recommended Fixes

1. **[high] Organization-level schema is missing**
   Add Organization or LocalBusiness JSON-LD with name, URL, logo, sameAs, and contact.
2. **[high] sitemap.xml was not found**
   Publish an XML sitemap with canonical URLs for important pages.
3. **[high] Improve key schema.org types were detected**
   Add relevant JSON-LD such as Organization, Service, Product, FAQPage, or Article.
4. **[high] Improve schema is missing**
   Add Organization or LocalBusiness schema to the homepage.
5. **[medium] meta description is missing or too thin**
   Write a direct description with brand, business type, audience, location, and services.
6. **[medium] Business type is not explicit**
   State the business type clearly, such as open-source toolkit, school, SaaS, or platform.
7. **[medium] Service description is weak**
   Add a short service overview and dedicated service pages.
8. **[medium] Target audience is unclear**
   Add explicit audience copy such as developers, maintainers, marketers, or parents.
9. **[medium] robots.txt was not found**
   Publish a clear robots.txt and include a Sitemap directive.
10. **[medium] Canonical URL coverage is low**
   Add canonical links to important indexable pages.

## Entity Understanding

- Brand/title signal found: Example Domain
- Homepage H1 found: Example Domain
- Contact information or contact page discovered.

## Schema & Structured Data

- 0% of crawled pages include JSON-LD.

## Content Readability for LLMs

- 100% of pages include an H1.
- 0% of pages include H2 sections.
- 0 pages have at least 800 visible text characters.
- FAQ-like content discovered.
- 0 pages include definition-style explanatory paragraphs.
- No severe text-to-visual ratio warning detected.

## Citation Readiness

- 7 pages include external references.
- About/contact trust pages are available.

## Prompt Simulation Results

- Provider adapters are scaffolded, but no API-backed prompt simulation ran.

## Next Actions

1. Fix high-severity entity and discoverability issues first.
2. Add schema.org JSON-LD for the organization and key content types.
3. Expand thin pages into clear, chunkable, answer-ready sections.
4. Add citations, freshness markers, and trust signals to factual content.
