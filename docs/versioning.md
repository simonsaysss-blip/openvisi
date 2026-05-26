# Versioning

OpenVisi is currently in the `0.x` series.

`0.x` means public contracts are useful but may still evolve as the artifact pipeline hardens.

## Artifact Contract Changes

Artifact contracts should avoid breaking changes when possible.

Any breaking artifact schema change requires:

- `schemaVersion` update
- golden fixture update
- documentation update
- migration note in release notes or changelog
- downstream compatibility review

## Package Versions

Workspace packages currently use aligned `0.1.0` versions for the v0.1.0 release candidate.

Do not change versions casually. Version changes should correspond to a release decision.

## Real Provider Contracts

Real provider support should be introduced behind explicit versioned contracts.

Provider adapters should not bypass artifact review gates, and final metrics should not be generated unless finalization allows them.
