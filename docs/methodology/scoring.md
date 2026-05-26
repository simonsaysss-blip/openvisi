# OpenVisi Scoring

OpenVisi scoring must remain explainable. A composite score is useful only when
teams can inspect the component metrics and understand why the score changed.

## v0.1 Scoring Proposal

The `aiVisibilityScore` can be calculated as a weighted composite:

- `answerPresence`: 15%
- `answerShare`: 10%
- `entityClarity`: 20%
- `citationCoverage`: 15%
- `competitorDisplacement`: 15%
- `machineReadableTrust`: 15%
- `aiCitationSignals`: 10%

This is a transparent v0.1 proposal, not a final formula.

## Important Warning

OpenVisi should avoid black-box scoring. Any score must expose:

- the input metrics
- metric definitions
- methodology version
- evidence behind each metric
- known limitations

## Directional Use

Early scores should be interpreted directionally. They are most useful for
repeat scans, methodology experiments, and benchmark snapshots where prompt
packs and source surfaces are clearly documented.
