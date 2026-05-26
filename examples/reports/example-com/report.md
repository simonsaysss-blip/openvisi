# Machine-Readable Visibility Diagnostic Report

## Snapshot Summary

- Target: https://example.com/
- Domain: example.com
- Generated at: 2026-05-26T00:12:02.793Z
- Methodology version: 0.1
- Crawled pages: 7
- Robots respected: yes
- AI Visibility Score: 34/100

This report is a heuristic diagnostic snapshot of public machine-readable visibility signals. It does not predict rankings, citations, or answer inclusion in any specific LLM-powered product.

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
- Maturity: heuristic
- Issues: 6
- Recommendations: 6

Interpretation:
This analyzer is heuristic and should be read directionally. Detected signals are partial, and 6 diagnostic gap(s) should be reviewed.

Detected signals:
- Brand/title signal found: Example Domain
- Homepage H1 found: Example Domain
- Contact information or contact page discovered.

Missing signals:
- Homepage meta description is missing or too thin
- Business type is not explicit
- Service description is weak
- Location or service area is unclear
- Target audience is unclear
- Organization-level schema is missing

Suggested structural improvements:
- Write a direct description with brand, business type, audience, location, and services.
- State the business type clearly, such as open-source toolkit, school, product, or platform.
- Add a short service overview and dedicated service pages.
- Add city, region, country, or service-area details where relevant.
- Add explicit audience copy such as developers, maintainers, marketers, or parents.
- Add Organization or LocalBusiness JSON-LD with name, URL, logo, sameAs, and contact.


### Technical Analyzer

- Score: 12/100
- Maturity: heuristic
- Issues: 7
- Recommendations: 7

Interpretation:
This analyzer is heuristic and should be read directionally. Detected signals are weak or limited, with 7 diagnostic gap(s) surfaced.

Detected signals:
- 1 of 7 crawled pages returned 2xx status.
- 0% coverage for canonical url coverage is low.
- 0% coverage for meta description coverage is low.
- 0% coverage for open graph coverage is low.
- 0% coverage for json-ld coverage is low.

Missing signals:
- robots.txt was not found
- sitemap.xml was not found
- llms.txt was not found
- Canonical URL coverage is low
- Meta description coverage is low
- Open Graph coverage is low
- JSON-LD coverage is low

Suggested structural improvements:
- Publish a clear robots.txt and include a Sitemap directive.
- Publish an XML sitemap with canonical URLs for important pages.
- Add /llms.txt with concise site, product, documentation, and contact guidance.
- Add canonical links to important indexable pages.
- Add direct, non-duplicative meta descriptions to important pages.
- Add og:title, og:description, og:url, and og:image to public pages.
- Add JSON-LD to the homepage and high-value informational pages.


### Structured Data Analyzer

- Score: 10/100
- Maturity: heuristic
- Issues: 3
- Recommendations: 3

Interpretation:
This analyzer is heuristic and should be read directionally. Detected signals are weak or limited, with 3 diagnostic gap(s) surfaced.

Detected signals:
- 0% of crawled pages include JSON-LD.

Missing signals:
- No key schema.org types were detected
- Entity schema is missing
- FAQPage schema was not detected

Suggested structural improvements:
- Add relevant JSON-LD such as Organization, Service, Product, FAQPage, or Article.
- Add Organization or LocalBusiness schema to the homepage.
- Add FAQPage JSON-LD to pages that already contain real user questions and answers.


### Content Analyzer

- Score: 54/100
- Maturity: heuristic
- Issues: 1
- Recommendations: 1

Interpretation:
This analyzer is heuristic and should be read directionally. Detected signals are partial, and 1 diagnostic gap(s) should be reviewed.

Detected signals:
- 100% of pages include an H1.
- 0% of pages include H2 sections.
- 0 pages have at least 800 visible text characters.
- FAQ-like content discovered.
- 0 pages include definition-style explanatory paragraphs.
- No severe text-to-visual ratio warning detected.

Missing signals:
- Some pages appear text-poor

Suggested structural improvements:
- Add concise explanatory copy, headings, and answer-ready paragraphs to thin pages.


### Citation Readiness Analyzer

- Score: 48/100
- Maturity: heuristic
- Issues: 3
- Recommendations: 3

Interpretation:
This analyzer is heuristic and should be read directionally. Detected signals are partial, and 3 diagnostic gap(s) should be reviewed.

Detected signals:
- 7 pages include external references.
- About/contact trust pages are available.

Missing signals:
- Author, reviewer, or last-updated signals are weak
- Clear factual claims are limited
- Evidence pages were not discovered

Suggested structural improvements:
- Add author/reviewer names and last-updated dates to important informational pages.
- Add factual statements with dates, numbers, qualifications, and supporting context.
- Create resource, case study, research, or documentation pages for important claims.


### Prompt Simulation Analyzer

- Score: 50/100
- Maturity: experimental
- Issues: 1
- Recommendations: 1

Interpretation:
Prompt simulation is experimental in methodology version 0.1 and does not affect claims about real LLM answer behavior.

Detected signals:
- Provider adapter scaffolding is present.

Missing signals:
- Provider-backed prompt simulation was not run.

Suggested structural improvements:
- Keep provider-backed interpretation checks optional and explicitly separated from crawl-only diagnostics.


## Priority Diagnostic Signals

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
   Evidence: State the business type clearly, such as open-source toolkit, school, product, or platform.
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

## Suggested Structural Improvements

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
   State the business type clearly, such as open-source toolkit, school, product, or platform.
7. **[medium] Service description is weak**
   Add a short service overview and dedicated service pages.
8. **[medium] Target audience is unclear**
   Add explicit audience copy such as developers, maintainers, marketers, or parents.
9. **[medium] robots.txt was not found**
   Publish a clear robots.txt and include a Sitemap directive.
10. **[medium] Canonical URL coverage is low**
   Add canonical links to important indexable pages.

## Entity Clarity Evidence

- Brand/title signal found: Example Domain
- Homepage H1 found: Example Domain
- Contact information or contact page discovered.

## Schema & Structured Data

- 0% of crawled pages include JSON-LD.

## Content Structure Evidence

- 100% of pages include an H1.
- 0% of pages include H2 sections.
- 0 pages have at least 800 visible text characters.
- FAQ-like content discovered.
- 0 pages include definition-style explanatory paragraphs.
- No severe text-to-visual ratio warning detected.

## Citation Readiness

- 7 pages include external references.
- About/contact trust pages are available.

## Prompt Simulation Placeholder

- Provider adapters are scaffolded, but no API-backed prompt simulation ran.

## Suggested Follow-up Analysis

1. Review high-severity entity and discoverability signals first.
2. Add explicit schema.org JSON-LD for the organization and key content types where appropriate.
3. Expand thin pages with clear, chunkable, crawlable explanations.
4. Add attribution, freshness markers, and evidence pages for factual claims.
