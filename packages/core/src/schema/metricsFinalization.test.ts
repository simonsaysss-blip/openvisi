import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateMetricsFinalizationBundleShape,
  type MetricsFinalizationBundle
} from "./metricsFinalization.js";

const fixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/metrics-finalization/metrics-finalization.json"
);

describe("MetricsFinalizationBundle contract", () => {
  it("accepts a valid blocked fixture", async () => {
    expect(validateMetricsFinalizationBundleShape(await readFixture())).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateMetricsFinalizationBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        "status must be blocked or ready.",
        "sourceArtifacts must be an object.",
        "readiness must be an object.",
        "decision must be an object."
      ])
    );
  });

  it("rejects invalid status", async () => {
    expect(validateMetricsFinalizationBundleShape({ ...(await readFixture()), status: "review" })).toContain(
      "status must be blocked or ready."
    );
  });

  it("rejects metrics.json permission when final metrics readiness is false", async () => {
    const fixture = await readFixture();

    expect(
      validateMetricsFinalizationBundleShape({
        ...fixture,
        decision: {
          ...fixture.decision,
          allowedToGenerateMetricsJson: true
        }
      })
    ).toContain(
      "decision.allowedToGenerateMetricsJson must be false when readiness.readyForFinalMetrics is false."
    );
  });

  it("rejects final score permission when AI Visibility Score readiness is false", async () => {
    const fixture = await readFixture();

    expect(
      validateMetricsFinalizationBundleShape({
        ...fixture,
        decision: {
          ...fixture.decision,
          allowedToComputeAiVisibilityScore: true
        }
      })
    ).toContain(
      "decision.allowedToComputeAiVisibilityScore must be false when readiness.readyForAiVisibilityScore is false."
    );
  });

  it("rejects scan result permission when metrics.json generation is blocked", async () => {
    const fixture = await readFixture();

    expect(
      validateMetricsFinalizationBundleShape({
        ...fixture,
        decision: {
          ...fixture.decision,
          allowedToGenerateScanResult: true
        }
      })
    ).toContain(
      "decision.allowedToGenerateScanResult must be false when decision.allowedToGenerateMetricsJson is false."
    );
  });

  it("rejects final aiVisibilityScore if included", async () => {
    expect(
      validateMetricsFinalizationBundleShape({ ...(await readFixture()), aiVisibilityScore: 100 })
    ).toContain("metrics finalization bundle must not include final aiVisibilityScore.");
  });
});

async function readFixture(): Promise<MetricsFinalizationBundle> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as MetricsFinalizationBundle;
}
