import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateMetricsReviewBundleShape, type MetricsReviewBundle } from "./metricsReview.js";

const fixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/metrics-review/metrics-review.json"
);

describe("MetricsReviewBundle contract", () => {
  it("accepts a valid bundle", async () => {
    expect(validateMetricsReviewBundleShape(await readFixture())).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateMetricsReviewBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        'status must be "review".',
        "sourceArtifacts must be an object.",
        "readiness must be an object.",
        "metricReviews must be an object."
      ])
    );
  });

  it("rejects status other than review", async () => {
    expect(validateMetricsReviewBundleShape({ ...(await readFixture()), status: "draft" })).toContain(
      'status must be "review".'
    );
  });

  it("rejects readyForAiVisibilityScore when evidence mode is mock", async () => {
    const fixture = await readFixture();

    expect(
      validateMetricsReviewBundleShape({
        ...fixture,
        readiness: {
          ...fixture.readiness,
          readyForAiVisibilityScore: true
        }
      })
    ).toContain("readiness.readyForAiVisibilityScore must be false when evidenceMode is mock.");
  });

  it("rejects final aiVisibilityScore if included", async () => {
    expect(validateMetricsReviewBundleShape({ ...(await readFixture()), aiVisibilityScore: 90 })).toContain(
      "metrics review bundle must not include final aiVisibilityScore."
    );
  });
});

async function readFixture(): Promise<MetricsReviewBundle> {
  return JSON.parse(await readFile(fixturePath, "utf8")) as MetricsReviewBundle;
}
