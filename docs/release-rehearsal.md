# Release Rehearsal

`npm run release:rehearse` verifies the OpenVisi v0.1.0 release candidate locally without publishing anything.

It is a maintainer rehearsal, not a release command.

## Command

```bash
npm run release:rehearse
```

To clean the local rehearsal workspace:

```bash
npm run release:rehearse:clean
```

## What It Does

The rehearsal script:

1. Cleans `.openvisi-release/`.
2. Runs `npm run release:check`.
3. Runs root `npm pack --dry-run`.
4. Runs workspace package `npm pack --dry-run` checks.
5. Packs the CLI and required workspace dependencies into `.openvisi-release/packs/`.
6. Creates `.openvisi-release/install-smoke/`.
7. Installs the local CLI tarball into the smoke project.
8. Runs local CLI smoke commands:
   - `npx --no-install openvisi --help`
   - `npx --no-install openvisi init`
   - `npx --no-install openvisi scan --dry-run --provider mock --output openvisi-report`
   - `npx --no-install openvisi artifacts inspect --output openvisi-report --stage dry-run`
9. Writes `.openvisi-release/summary.json`.

## What It Does Not Do

- It does not run `npm publish`.
- It does not create a git tag.
- It does not create a GitHub release.
- It does not call OpenAI, Anthropic, Google, Gemini, or other real providers.
- It does not read API keys.
- It does not generate `metrics.json`.
- It does not compute a final AI Visibility Score.
- It does not generate `scan-result.json`.
- It does not generate final `report.md` or `report.html`.

## Output

```text
.openvisi-release/
  packs/
  install-smoke/
  logs/
  summary.json
```

Expected summary fields:

```json
{
  "status": "passed",
  "releaseCandidate": "v0.1.0",
  "published": false,
  "gitTagCreated": false,
  "finalMetricsGenerated": false,
  "finalAiVisibilityScoreGenerated": false
}
```

The workspace is ignored by git and kept after a successful rehearsal for inspection.
