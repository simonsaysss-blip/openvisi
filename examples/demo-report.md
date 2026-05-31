# OpenVisi Demo Report Template

AI Visibility is the measurable presence, accuracy, citation quality, and
competitive position of an entity across AI-generated answers.

This is a directional sample report based on OpenVisi's AI Visibility Benchmark
schema. It is not a provider-verified benchmark result and does not represent a
final AI Visibility Score.

This template shows how OpenVisi reports should explain metrics as a category
measurement language, not only as scanner output.

All example values below are directional placeholders for the v0.1 schema.

## 1. AI Visibility Score

Definition: A transparent composite score summarizing the entity's measurable AI
Visibility signals.

Example directional placeholder metrics: `aiVisibilityScore: 72`.

Example interpretation: The entity has useful visibility signals, but citation
coverage and competitor displacement still limit the overall score.

Example action items: Review component metrics, document methodology version,
and prioritize fixes that improve multiple layers at once.

## 2. Answer Presence

Definition: Whether the target entity appears in AI-generated answers for the
selected prompt pack.

Example placeholder metrics: `answerPresence: 0.64`, `promptCoverage: 0.92`.

Example interpretation: The entity appears in most measurable prompts, but some
problem-solution prompts omit it.

Example action items: Expand category pages, add problem-solution language, and
rerun the same prompt pack after changes.

## 3. Entity Clarity

Definition: How clearly public sources explain what the entity is, what category
it belongs to, who it serves, and how it differs from alternatives.

Example placeholder metrics: `entityClarity: 0.71`,
`narrativeAccuracy: 0.68`.

Example interpretation: The entity is mostly understandable, but some answers
use outdated or generic positioning.

Example action items: Add a canonical entity definition, update homepage and
docs copy, and align metadata with the same category language.

## 4. Citation Coverage

Definition: The share of answers that cite or rely on sources connected to the
target entity.

Example placeholder metrics: `citationCoverage: 0.38`,
`officialSourceCitationRate: 0.29`.

Example interpretation: AI answers mention the entity more often than they cite
official sources.

Example action items: Publish citation-ready documentation, improve source
freshness, and make official URLs stable.

## 5. AI Citation Signals

Definition: Public signals that increase the likelihood that the entity or its
sources can be cited in AI-generated answers.

Example placeholder metrics: `aiCitationSignals: 0.49`.

Example interpretation: The site has some citeable material, but evidence pages
and structured trust signals are incomplete.

Example action items: Add source pages for important claims, structured FAQs,
last-updated dates, and references to official documentation.

## 6. Competitor Displacement

Definition: The rate at which AI answers recommend, cite, or describe
competitors instead of the target entity.

Example placeholder metrics: `competitorDisplacement: 0.42`,
`categoryShare: 0.31`.

Example interpretation: Competitors are still capturing a material share of
category and comparison answers.

Example action items: Publish comparison pages, clarify ideal use cases, and
close source gaps that cause competitor-controlled narratives to dominate.

## 7. AI-readable Structure

Definition: The way content is organized so AI systems can parse, classify, and
cite it.

Example placeholder metrics: `promptCoverage: 0.92`,
`comparisonVisibility: 0.44`.

Example interpretation: Core pages are crawlable, but comparison and FAQ
structures are not yet strong enough.

Example action items: Add stable URLs, structured FAQ sections, comparison
pages, schema metadata, and clear product/category pages.

## 8. Machine-readable Trust

Definition: Signals that help machines assess credibility, authority, and
freshness.

Example placeholder metrics: `machineReadableTrust: 0.56`,
`thirdPartySourceReliance: 0.47`.

Example interpretation: Trust evidence exists but is not consistently structured
or anchored to official sources.

Example action items: Add organization clarity, maintain freshness markers,
publish documentation depth, and reconcile third-party descriptions with
official positioning.

## 9. Source Gaps

Definition: Missing or weak sources that prevent AI systems from understanding,
verifying, or citing the entity.

Example placeholder metrics: `citationCoverage: 0.38`,
`officialSourceCitationRate: 0.29`.

Example interpretation: The most important facts lack stable official source
pages.

Example action items: Create source pages for category definition, product
capabilities, target audience, integrations, pricing context, and comparisons.

## 10. Recommended Fixes

Definition: Prioritized actions tied to measurable AI Visibility gaps.

Example placeholder metrics: priority score `high`, affected metrics
`entityClarity`, `citationCoverage`, `machineReadableTrust`.

Example interpretation: The first fixes should improve both clarity and
citability instead of chasing isolated score changes.

Example action items: Add canonical entity copy, strengthen official source
citations, improve schema metadata, and rerun the same prompt pack.
