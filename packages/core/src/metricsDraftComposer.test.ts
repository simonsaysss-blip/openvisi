import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { composeMetricsDraftFromMeasurementInputs } from "./metricsDraftComposer.js";
import { validateMetricsDraftBundleShape } from "./schema/metricsDraft.js";
import type { MeasurementInputBundle } from "./schema/measurementInputs.js";

const measurementFixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/measurement-inputs/measurement-inputs.json"
);

describe("composeMetricsDraftFromMeasurementInputs", () => {
  it("returns deterministic draft metrics from measurement inputs", async () => {
    const draft = composeMetricsDraftFromMeasurementInputs({
      measurementInputs: await readMeasurementFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(validateMetricsDraftBundleShape(draft)).toEqual([]);
    expect(draft.generatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(draft.status).toBe("draft");
    expect(draft.final).toBe(false);
    expect(draft.evidenceMode).toBe("mock");
  });

  it("uses transparent draft formulas", async () => {
    const draft = composeMetricsDraftFromMeasurementInputs({
      measurementInputs: await readMeasurementFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(draft.draftMetrics.answerPresence.value).toBe(1);
    expect(draft.draftMetrics.answerPresence.explanation).toBe(
      "answersWithTargetBrand / answerCount"
    );
    expect(draft.draftMetrics.answerShare.value).toBeCloseTo(2 / 3);
    expect(draft.draftMetrics.entityClarity.value).toBeCloseTo(2 / 3);
    expect(draft.draftMetrics.citationCoverage.value).toBe(0);
    expect(draft.draftMetrics.competitorDisplacement.value).toBe(0);
    expect(draft.draftMetrics.aiReadableStructure.value).toBe(0.625);
    expect(draft.draftMetrics.machineReadableTrust.value).toBe(0.5);
    expect(draft.draftMetrics.aiCitationSignals.value).toBe(0.75);
  });

  it("marks narrativeAccuracy unavailable with mock evidence", async () => {
    const draft = composeMetricsDraftFromMeasurementInputs({
      measurementInputs: await readMeasurementFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(draft.draftMetrics.narrativeAccuracy.value).toBeNull();
    expect(draft.draftMetrics.narrativeAccuracy.available).toBe(false);
    expect(draft.draftMetrics.narrativeAccuracy.explanation).toBe(
      "narrativeAccuracy requires real LLM output or human review."
    );
  });

  it("excludes final aiVisibilityScore", async () => {
    const draft = composeMetricsDraftFromMeasurementInputs({
      measurementInputs: await readMeasurementFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect("aiVisibilityScore" in draft.draftMetrics).toBe(false);
    expect(draft.excludedMetrics).toContainEqual({
      name: "aiVisibilityScore",
      reason: "Final AI Visibility Score is not computed in Stage 4A."
    });
  });

  it("includes derivedFrom and explanation for every draft metric", async () => {
    const draft = composeMetricsDraftFromMeasurementInputs({
      measurementInputs: await readMeasurementFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    for (const metric of Object.values(draft.draftMetrics)) {
      expect(metric.derivedFrom.length).toBeGreaterThan(0);
      expect(metric.explanation.length).toBeGreaterThan(0);
    }
  });

  it("does not mutate measurement input", async () => {
    const measurementInputs = await readMeasurementFixture();
    const before = JSON.stringify(measurementInputs);

    composeMetricsDraftFromMeasurementInputs({
      measurementInputs,
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(JSON.stringify(measurementInputs)).toBe(before);
  });
});

async function readMeasurementFixture(): Promise<MeasurementInputBundle> {
  return JSON.parse(await readFile(measurementFixturePath, "utf8")) as MeasurementInputBundle;
}
