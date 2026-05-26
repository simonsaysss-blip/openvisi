import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateMetricsDraftBundleShape, type MetricsDraftBundle } from "./metricsDraft.js";

const fixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/metrics-draft/metrics-draft.json"
);

describe("MetricsDraftBundle contract", () => {
  it("accepts a valid bundle", async () => {
    expect(validateMetricsDraftBundleShape(await readFixture())).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateMetricsDraftBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        'status must be "draft".',
        "final must be false.",
        "sourceArtifacts must be an object.",
        "draftMetrics must be an object."
      ])
    );
  });

  it("rejects aiVisibilityScore at top level", async () => {
    expect(validateMetricsDraftBundleShape({ ...(await readFixture()), aiVisibilityScore: 88 })).toContain(
      "metrics draft bundle must not include aiVisibilityScore."
    );
  });

  it("rejects aiVisibilityScore inside draftMetrics", async () => {
    const bundle = await readFixture();

    expect(
      validateMetricsDraftBundleShape({
        ...bundle,
        draftMetrics: {
          ...bundle.draftMetrics,
          aiVisibilityScore: {
            value: 88,
            available: true,
            derivedFrom: ["measurement-inputs"],
            explanation: "not allowed"
          }
        }
      })
    ).toContain("draftMetrics must not include aiVisibilityScore.");
  });
});

async function readFixture(): Promise<MetricsDraftBundle> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as MetricsDraftBundle;
}
