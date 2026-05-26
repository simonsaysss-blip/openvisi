# OpenVisi Crawler

Stage 2A introduces a `CrawledPageSnapshot` adapter boundary.

OpenVisi defines an open-source measurement layer for AI Visibility. AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.

## What Stage 2A Adds

The crawler package now exposes an adapter that maps current static crawler output into OpenVisi's canonical scan contract:

```ts
toCrawledPageSnapshot(input)
```

The adapter accepts current static crawl artifacts such as URL, title, text, metadata, JSON-LD, headings, links, fetched timestamp, and render mode. It returns a stable `CrawledPageSnapshot` shape from `@openvisi/core`.

## What It Does Not Add

Stage 2A does not add headless crawling.

It does not use Playwright, Puppeteer, browser automation, LLM provider calls, evaluator logic, dashboard behavior, SQLite persistence, or generated metrics.

## Machine-readable Trust Diagnostics

The crawler diagnostics layer extracts transparent signals from available page data:

- JSON-LD presence
- Organization or LocalBusiness-like schema
- Product or SoftwareApplication-like schema
- FAQPage schema
- author metadata
- last-modified metadata
- canonical URL presence
- HTTPS URL usage

Unknown signals are left false or undefined based on what is observable from the input. The adapter does not invent JSON-LD, links, headings, or page content.

## AI-readable Structure Diagnostics

The adapter also extracts structure-oriented diagnostics:

- exactly one clear H1
- docs-like structure
- FAQ section signals
- comparison or alternatives page signals
- stable navigation when enough internal links are present
- content depth estimate based on visible text word count

These are crawler-derived diagnostics, not AI-generated evaluations.

## Stage 2B Static Persistence

Stage 2B persists canonical snapshots from the existing static crawler through the CLI:

```bash
openvisi crawl --config openvisi.config.json --output openvisi-report --render-mode static
```

The command writes:

```text
openvisi-report/
  crawled-pages.json
  crawler-summary.json
  structure-trust-inputs.json
  artifact-manifest.json
  report-references.json
  warnings.json
```

`crawled-pages.json` is a canonical `CrawledPageSnapshot[]` artifact. It is intended for later evaluator, metrics, and report stages.

`crawler-summary.json` and `crawled-pages.json` are now referenced by `artifact-manifest.json` and `report-references.json`, making them discoverable by future report and evaluator stages.

## Stage 2F Structure and Trust Inputs

Stage 2F adds `structure-trust-inputs.json`.

This artifact is derived from canonical `CrawledPageSnapshot` diagnostics and the crawler summary. It summarizes AI-readable Structure, Machine-readable Trust, AI Citation Signal inputs, preferred source domains, and source gap candidates.

It is an input artifact only. It is not `metrics.json`, does not include `aiVisibilityScore`, and does not represent a completed AI Visibility scan.

Stage 2B still does not compute AI Visibility metrics, generate LLM answers, create citations, or write a completed `scan-result.json`.

## Future Stage 2C

A later Stage 2C may introduce optional headless rendering with Playwright or Puppeteer. That future work should write into the same `CrawledPageSnapshot` contract instead of changing downstream scan or report interfaces.
