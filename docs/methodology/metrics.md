# OpenVisi Metrics

OpenVisi metrics use canonical field names so reports, schemas, benchmarks, and
future CLI output can speak the same language.

## Core Fields

### `aiVisibilityScore`

A transparent composite score for AI Visibility. It summarizes component
metrics, but each component should remain inspectable.

### `answerPresence`

The rate at which the target entity appears in AI-generated answers for a prompt
pack.

### `answerShare`

The target entity's share of mentions or recommendation slots across relevant
answers.

### `entityClarity`

How clearly the public source material defines the entity, category, audience,
offering, and differentiation.

### `citationCoverage`

The share of answers that cite or rely on sources connected to the target
entity.

### `competitorDisplacement`

The rate at which AI answers recommend, cite, or describe competitors instead of
the target entity.

### `machineReadableTrust`

The strength of parseable credibility, authority, source freshness, and official
source consistency signals.

### `aiCitationSignals`

The strength of public signals that increase the likelihood of being cited in
AI-generated answers.

### `narrativeAccuracy`

How accurately AI-generated answers describe the entity, its category, product,
audience, and current positioning.

### `officialSourceCitationRate`

The rate at which AI answers cite official sources controlled by or directly
associated with the target entity.

### `thirdPartySourceReliance`

The rate at which AI answers rely on third-party sources to describe or validate
the target entity.

## Supporting Fields

`promptCoverage` measures how much of a prompt pack produced valid measurable
answers.

`categoryShare` measures the target entity's share within a category-level
answer set.

`alternativeRecommendationRate` measures how often alternatives are recommended
for prompts where the target entity should be considered.

`comparisonVisibility` measures whether the target entity appears in comparison
or alternative-selection answers.
