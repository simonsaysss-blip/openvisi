# Release Checklist

This checklist prepares an OpenVisi v0.1.0 public release candidate.

## 1. Pre-release Validation

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
git diff --check
```

## 2. Package Metadata

- Root package metadata is complete.
- Workspace package descriptions use AI Visibility language.
- License metadata is present.
- Repository and issue links are present where appropriate.
- CLI package exposes the `openvisi` bin.

```bash
npm run check:metadata
```

## 3. CLI Smoke Tests

- `npx openvisi --help`
- `npx openvisi artifacts inspect --help`
- `npx openvisi debug report --help`

## 4. Artifact Contract Validation

- Golden fixtures pass tests.
- Artifact manifests use relative paths.
- No stage writes final artifacts before the finalization guard allows them.

```bash
npm test
```

## 5. Demo Verification

```bash
npm run demo:mock
```

Expected result:

- final metrics generated: no
- final AI Visibility Score generated: no
- evidence mode: mock
- finalization status: blocked

## 6. Documentation Review

```bash
npm run check:docs
```

Review:

- README
- quickstart
- demo pipeline
- artifact docs
- metrics draft/review/finalization docs
- security and contributing docs

## 7. Security Review

- No API keys are required for the current mock pipeline.
- No examples contain API keys or API-key-like placeholders.
- Runtime artifact directories are ignored.
- Generated crawl artifacts are treated as local runtime data.

```bash
npm run check:release-artifacts
```

## 8. Publishing Dry-run

```bash
npm pack --dry-run
```

Do not run `npm publish` automatically. Publishing is a manual release action.

## 9. Release Rehearsal

Run the local release rehearsal before any manual publish or tag action:

```bash
npm run release:rehearse
```

Expected result:

- local package dry-runs pass
- CLI tarball install smoke passes
- `.openvisi-release/summary.json` reports `status: "passed"`
- `published` is `false`
- `gitTagCreated` is `false`
- final metrics generated: no

See [Release Rehearsal](release-rehearsal.md).

## 10. RC Freeze Review

Run the RC freeze check after cleaning demo and rehearsal artifacts:

```bash
npm run release:rc-check
```

Review:

- [RC Freeze Review](release-notes/v0.1.0-rc-freeze-review.md)
- [Known Limitations](release-notes/v0.1.0-known-limitations.md)
- [Publish Plan](release-notes/v0.1.0-publish-plan.md)

Expected result:

- required release docs are present
- runtime artifact directories are clean
- mock-only limitations are explicit
- no final metrics or final AI Visibility Score claims are present

## 11. Release Notes

- Review `docs/release-notes/v0.1.0.md`.
- Review `docs/release-notes/v0.1.0-rc-checklist.md`.
- Review `docs/release-notes/v0.1.0-rc-freeze-review.md`.
- Review `docs/release-notes/v0.1.0-known-limitations.md`.
- Review `docs/release-notes/v0.1.0-publish-plan.md`.
- Confirm limitations are explicit.
- Confirm real provider adapters and final scoring are described as future work.

## 12. Post-release Checks

- Verify GitHub Actions CI is green.
- Verify README renders correctly.
- Verify issue templates and PR template are visible.
- Verify release tag and release notes if a release is created manually.
