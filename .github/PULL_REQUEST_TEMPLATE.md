## Summary

Describe the change and why it is needed.

## Stage Affected

- [ ] dry-run
- [ ] static-crawl
- [ ] evaluation
- [ ] measurement-inputs
- [ ] metrics-draft
- [ ] metrics-review
- [ ] metrics-finalization
- [ ] debug-report
- [ ] docs / examples only
- [ ] other

## Artifact Contracts

- Artifact contracts changed: yes / no
- Golden fixtures updated: yes / no / not applicable
- Downstream compatibility risk: low / medium / high

## Guardrail Checks

- Does this generate `metrics.json`? yes / no
- Does this compute final `aiVisibilityScore`? yes / no
- Does this write `scan-result.json`? yes / no
- Does this call real providers? yes / no
- Does this treat mock evidence as real LLM evidence? yes / no

## Commands Run

```bash
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
```

Add `npm run demo:mock` when the change affects CLI orchestration, artifact manifests, demo docs, or debug-report behavior.

## Screenshots or Sample Artifacts

Add relevant excerpts only. Do not paste private crawl output or secrets.

## Checklist

- [ ] Typecheck passed
- [ ] Tests passed
- [ ] Lint passed
- [ ] Build passed
- [ ] `git diff --check` passed
- [ ] `npm run demo:mock` passed, if relevant
