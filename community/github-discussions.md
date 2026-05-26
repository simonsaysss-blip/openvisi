# GitHub Discussions Plan

Use GitHub Discussions to pressure-test the OpenVisi vocabulary and measurement
model before it hardens into benchmark defaults.

## 1. What should AI Visibility mean?

Objective: Validate the canonical definition and identify unclear wording.

Opening post draft: OpenVisi currently defines AI Visibility as the measurable
presence, accuracy, citation quality, and competitive position of an entity
across AI-generated answers. Is this definition precise enough for reports,
benchmarks, and schema fields?

Desired community feedback: Missing dimensions, ambiguous words, examples where
the definition fails.

## 2. How should Entity Clarity be measured?

Objective: Improve the metric without turning it into subjective brand review.

Opening post draft: Entity Clarity measures whether AI systems can understand
what an entity is, what category it belongs to, who it serves, and how it
differs from alternatives. Which observable source signals should count most?

Desired community feedback: Source signals, failure modes, fixture ideas, and
edge cases across categories.

## 3. What counts as an AI Citation Signal?

Objective: Define citation signals without reducing them to backlinks.

Opening post draft: OpenVisi uses AI Citation Signals for public signals that
increase the likelihood of being cited in AI-generated answers. What should
count: structured data, freshness, official docs, third-party references,
research pages, or something else?

Desired community feedback: Candidate signals, anti-gaming guardrails, and
examples of citeable source pages.

## 4. Should AI Visibility Score be composite or modular?

Objective: Decide how much weight to give a single score versus component
metrics.

Opening post draft: A composite AI Visibility Score is useful for snapshots, but
it can become misleading if it hides component metrics. Should OpenVisi lead
with one composite score, modular layer scores, or both?

Desired community feedback: Reporting preferences, weighting concerns, and
examples of score misuse.

## 5. What makes a website AI-readable?

Objective: Convert AI-readable Structure into observable checks.

Opening post draft: OpenVisi defines AI-readable Structure as the way content is
organized so AI systems can parse, classify, and cite it. Which structures are
most important for real-world sites?

Desired community feedback: Documentation patterns, schema examples, URL
patterns, FAQ structures, and crawlability issues.

## 6. How should OpenVisi handle benchmark methodology?

Objective: Create reproducible benchmark language before publishing benchmark
snapshots.

Opening post draft: OpenVisi benchmarks should document prompt packs,
methodology version, measurement date, source surfaces, and limitations. What
else should every benchmark include to be reproducible and fair?

Desired community feedback: Benchmark fields, disclosure requirements,
limitations language, and repeatability standards.
