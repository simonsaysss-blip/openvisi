# Metrics Draft

Stage 4A introduces `metrics-draft.json`.

This artifact is derived from `measurement-inputs.json`.

It is not `metrics.json`.

It does not compute final `aiVisibilityScore`.

It does not imply a completed AI Visibility scan.

## Command

```bash
npx openvisi metrics draft \
  --measurement-output openvisi-measurement \
  --output openvisi-metrics-draft
```

The command writes:

```text
openvisi-metrics-draft/
  metrics-draft.json
  artifact-manifest.json
  warnings.json
```

It does not write `metrics.json`, `scan-result.json`, reports, citation artifacts, or raw source artifacts.

## Draft Formulas

Stage 4A formulas are transparent v0.1 draft formulas:

- `answerPresence`: `answersWithTargetBrand / answerCount`
- `answerShare`: `targetBrandMentions / max(targetBrandMentions + total competitor mentions, 1)`
- `entityClarity`: average of category, domain, and audience term signal rates
- `citationCoverage`: `answersWithTargetDomainCitation / answerCount`
- `competitorDisplacement`: `answersMentioningCompetitorsWithoutTargetBrand / answerCount`
- `aiReadableStructure`: average of clear H1, docs-like, FAQ, and comparison structure signal rates
- `machineReadableTrust`: average of JSON-LD, schema, metadata, canonical, and HTTPS signal rates
- `aiCitationSignals`: average of source structure booleans
- `narrativeAccuracy`: unavailable with mock evidence

Every draft metric includes:

- `value`
- `available`
- `derivedFrom`
- `explanation`
- optional limitations

## Limits

`metrics-draft.json` excludes final `aiVisibilityScore`.

When mock evaluator evidence is used, draft values are not real LLM evidence.

Final metrics should not blindly treat draft values as production scores. They are reviewable intermediate values before a future metrics composition stage.

## Review Gate

Stage 4B adds `metrics-review.json` as the review gate for `metrics-draft.json`.

Run the review gate before any future final metrics composition:

```bash
npx openvisi metrics review \
  --metrics-draft-output openvisi-metrics-draft \
  --output openvisi-metrics-review
```

The review gate blocks final metrics when evaluator evidence is mock.
