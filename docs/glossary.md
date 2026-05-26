# OpenVisi Glossary: Canonical Vocabulary for AI Visibility

OpenVisi defines a canonical vocabulary for measuring how brands, products,
websites, and entities appear across AI-generated answers.

AI Visibility is the measurable presence, accuracy, citation quality, and
competitive position of an entity across AI-generated answers.

This glossary is designed to make AI Visibility measurable, explainable, and
reproducible.

## AI Visibility

Definition: The measurable presence, accuracy, citation quality, and competitive
position of an entity across AI-generated answers.

Why it matters: Teams need a shared measurement language for how AI systems
describe, cite, and compare their entity.

Related metrics: `aiVisibilityScore`, `answerPresence`, `entityClarity`,
`citationCoverage`, `competitorDisplacement`.

Product surfaces: README, methodology docs, report summary, benchmark title,
future CLI output.

## LLM Search Visibility

Definition: The degree to which an entity appears and is represented accurately
across LLM-powered search and answer surfaces.

Why it matters: Discovery is moving from lists of links toward synthesized
answers, comparisons, and recommendations.

Related metrics: `answerPresence`, `answerShare`, `categoryShare`,
`comparisonVisibility`.

Product surfaces: concept docs, benchmark language, blog posts, future CLI
summaries.

## AI Answer Presence

Definition: Whether an AI-generated answer mentions the target entity for a
relevant prompt.

Why it matters: A brand cannot be evaluated, cited, or selected if it is absent
from the answer surface.

Related metrics: `answerPresence`, `promptCoverage`, `answerShare`.

Product surfaces: report section, methodology metrics, benchmark rows, future
scan output.

## AI Visibility Diagnostics

Definition: Explainable checks that show why an entity is visible, unclear,
uncited, or displaced in AI-generated answers.

Why it matters: Diagnostics turn a score into evidence-backed next steps instead
of an opaque number.

Related metrics: `entityClarity`, `citationCoverage`,
`machineReadableTrust`, `aiCitationSignals`.

Product surfaces: report interpretation, recommended fixes, CLI warnings,
methodology docs.

## AI Visibility Score

Definition: A composite score that summarizes the measurable AI Visibility
signals for a target entity.

Why it matters: The score provides a compact benchmark, but it must remain
explainable through its component metrics.

Related metrics: `aiVisibilityScore`, `answerPresence`, `answerShare`,
`entityClarity`, `citationCoverage`, `competitorDisplacement`,
`machineReadableTrust`, `aiCitationSignals`.

Product surfaces: README, report summary, benchmark snapshots, future CLI JSON.

## Answer Share

Definition: The target entity's share of mentions or recommendation slots across
a defined prompt pack.

Why it matters: Presence alone is incomplete when competitors dominate the same
answers.

Related metrics: `answerShare`, `categoryShare`,
`alternativeRecommendationRate`.

Product surfaces: methodology metrics, benchmark comparison, report examples.

## Citation Coverage

Definition: The share of AI-generated answers that cite or rely on sources
connected to the target entity.

Why it matters: Citations can indicate which public sources AI systems use to
understand or validate an entity.

Related metrics: `citationCoverage`, `officialSourceCitationRate`,
`thirdPartySourceReliance`, `aiCitationSignals`.

Product surfaces: report section, methodology docs, benchmark tables, future CLI
output.

## Competitor Displacement

Definition: The rate at which AI answers recommend, cite, or describe
competitors instead of the target entity.

Why it matters: Commercial visibility depends on whether AI systems route users
toward the target entity or toward alternatives.

Related metrics: `competitorDisplacement`, `categoryShare`,
`alternativeRecommendationRate`, `comparisonVisibility`.

Product surfaces: report section, benchmark language, concept docs, blog posts.

## Entity Clarity

Definition: How clearly public information explains what the entity is, what
category it belongs to, who it serves, and how it differs from alternatives.

Why it matters: Low clarity increases the chance of wrong categorization,
outdated positioning, or competitor confusion.

Related metrics: `entityClarity`, `narrativeAccuracy`,
`positioningAccuracy`, `productUnderstanding`.

Product surfaces: analyzer output, report section, concept docs, recommended
fixes.

## AI-readable Structure

Definition: The way content is organized so AI systems can parse, classify, and
cite it.

Why it matters: Clear structure helps machines identify definitions, product
facts, comparisons, FAQs, and canonical pages.

Related metrics: `entityClarity`, `citationCoverage`,
`machineReadableTrust`, `promptCoverage`.

Product surfaces: report section, structural recommendations, methodology docs,
future CLI diagnostics.

## Machine-readable Trust

Definition: Public signals that help machines assess credibility, authority, and
freshness.

Why it matters: AI systems need explicit trust evidence, not only polished
marketing copy.

Related metrics: `machineReadableTrust`, `officialSourceCitationRate`,
`thirdPartySourceReliance`, `narrativeAccuracy`.

Product surfaces: report section, concept docs, methodology metrics, recommended
fixes.

## AI Citation Signals

Definition: Public signals that increase the likelihood that an entity or source
can be cited in AI-generated answers.

Why it matters: AI Citation Signals are not backlinks, but they may become one
of the core trust layers for LLM-powered discovery.

Related metrics: `aiCitationSignals`, `citationCoverage`,
`officialSourceCitationRate`, `thirdPartySourceReliance`.

Product surfaces: report section, benchmark language, concept docs, founder
articles.
