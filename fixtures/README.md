# Fixtures

These fixtures are small synthetic examples for methodology validation.

They are not full crawler snapshots. Each fixture provides representative HTML plus a short JSON note describing expected signal strength.

Current fixtures:

- `strong-entity-site`: explicit entity, metadata, schema, audience, contact, and freshness signals
- `weak-entity-site`: vague identity, thin copy, missing metadata, and weak machine-readable structure
- `faq-heavy-site`: direct question-answer structure with FAQPage schema

## Expected Test Behavior

- `strong-entity-site` should produce stronger Entity Clarity than `weak-entity-site`.
- `weak-entity-site` should expose missing entity and machine-readable structure signals.
- `faq-heavy-site` should produce stronger content chunkability signals than `weak-entity-site`.

These expectations are directional. They are not absolute truth labels and should not be used as statistical benchmark conclusions.

## Adding Fixtures

When adding a fixture:

1. Use synthetic or clearly public-safe content.
2. Keep HTML small enough to inspect manually.
3. Include `fixture.json` with purpose, expected signal direction, and notes.
4. Prefer directional assertions such as `score A > score B`.
5. Avoid exact-score assertions unless the scoring rule itself is the unit under test.
6. Do not include private crawl output, API responses, or generated customer reports.

Future analyzer tests can use these examples to check whether scoring explanations remain directionally stable as the methodology evolves.
