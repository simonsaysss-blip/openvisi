import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMetricsReviewFromDraft } from "./metricsReviewGate.js";
import { validateMetricsReviewBundleShape } from "./schema/metricsReview.js";
import type { MetricsDraftBundle } from "./schema/metricsDraft.js";

const draftFixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/metrics-draft/metrics-draft.json"
);

describe("createMetricsReviewFromDraft", () => {
  it("returns deterministic review output", async () => {
    const review = createMetricsReviewFromDraft({
      metricsDraft: await readDraftFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(validateMetricsReviewBundleShape(review)).toEqual([]);
    expect(review.generatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(review.status).toBe("review");
    expect(review.evidenceMode).toBe("mock");
  });

  it("blocks final metrics and final score with mock evidence", async () => {
    const review = createMetricsReviewFromDraft({
      metricsDraft: await readDraftFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(review.readiness.readyForFinalMetrics).toBe(false);
    expect(review.readiness.readyForAiVisibilityScore).toBe(false);
    expect(review.readiness.productionReady).toBe(false);
    expect(review.blockingReasons.map((reason) => reason.code)).toContain(
      "mock_evaluator_evidence"
    );
    expect(review.blockingReasons.map((reason) => reason.code)).toContain("final_score_excluded");
  });

  it("blocks evaluator-derived metrics when evidence mode is mock", async () => {
    const review = createMetricsReviewFromDraft({
      metricsDraft: await readDraftFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    for (const metricName of [
      "answerPresence",
      "answerShare",
      "entityClarity",
      "citationCoverage",
      "competitorDisplacement"
    ] as const) {
      expect(review.metricReviews[metricName]).toMatchObject({
        decision: "blocked",
        eligibleForFinalization: false,
        blockingReasons: ["mock_evaluator_evidence"]
      });
    }
  });

  it("does not automatically block crawler-derived metrics because evaluator evidence is mock", async () => {
    const review = createMetricsReviewFromDraft({
      metricsDraft: await readDraftFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    for (const metricName of [
      "aiReadableStructure",
      "machineReadableTrust",
      "aiCitationSignals"
    ] as const) {
      expect(review.metricReviews[metricName]).toMatchObject({
        decision: "review_required",
        eligibleForFinalization: true,
        blockingReasons: []
      });
    }
  });

  it("blocks unavailable narrativeAccuracy", async () => {
    const review = createMetricsReviewFromDraft({
      metricsDraft: await readDraftFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(review.metricReviews.narrativeAccuracy.decision).toBe("blocked");
    expect(review.metricReviews.narrativeAccuracy.blockingReasons).toEqual([
      "unavailable_metric",
      "missing_metric_value",
      "narrative_accuracy_unavailable",
      "mock_evaluator_evidence"
    ]);
  });

  it("includes decisions, reasons, recommendations, and does not mutate input", async () => {
    const draft = await readDraftFixture();
    const before = JSON.stringify(draft);
    const review = createMetricsReviewFromDraft({
      metricsDraft: draft,
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    for (const metricReview of Object.values(review.metricReviews)) {
      expect(metricReview.decision.length).toBeGreaterThan(0);
      expect(metricReview.reason.length).toBeGreaterThan(0);
    }
    expect(review.recommendedNextActions.length).toBeGreaterThan(0);
    expect(JSON.stringify(draft)).toBe(before);
  });
});

async function readDraftFixture(): Promise<MetricsDraftBundle> {
  return JSON.parse(await readFile(draftFixturePath, "utf8")) as MetricsDraftBundle;
}
