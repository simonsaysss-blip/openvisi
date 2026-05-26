import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMetricsFinalizationFromReview } from "./metricsFinalizationGuard.js";
import { validateMetricsFinalizationBundleShape } from "./schema/metricsFinalization.js";
import type { MetricsReviewBundle } from "./schema/metricsReview.js";

const reviewFixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/artifact-bundles/metrics-review/metrics-review.json"
);

describe("createMetricsFinalizationFromReview", () => {
  it("returns deterministic blocked output from the review fixture", async () => {
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: await readReviewFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(validateMetricsFinalizationBundleShape(finalization)).toEqual([]);
    expect(finalization.generatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(finalization.status).toBe("blocked");
    expect(finalization.evidenceMode).toBe("mock");
  });

  it("blocks finalization under mock evidence", async () => {
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: await readReviewFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(finalization.decision.allowedToGenerateMetricsJson).toBe(false);
    expect(finalization.decision.allowedToComputeAiVisibilityScore).toBe(false);
    expect(finalization.decision.allowedToGenerateScanResult).toBe(false);
    expect(finalization.blockingReasons.map((reason) => reason.code)).toContain(
      "mock_evaluator_evidence"
    );
  });

  it("preserves readiness failures from metrics review", async () => {
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: await readReviewFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(finalization.readiness.readyForFinalMetrics).toBe(false);
    expect(finalization.readiness.readyForAiVisibilityScore).toBe(false);
    expect(finalization.readiness.productionReady).toBe(false);
  });

  it("blocks when metric review entries are blocked", async () => {
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: await readReviewFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(finalization.status).toBe("blocked");
    expect(finalization.blockingReasons.map((reason) => reason.code)).toContain(
      "missing_metric_value"
    );
    expect(finalization.blockingReasons.map((reason) => reason.code)).toContain(
      "unavailable_metric"
    );
  });

  it("blocks narrativeAccuracy review requirements", async () => {
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: await readReviewFixture(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(finalization.blockingReasons.map((reason) => reason.code)).toContain(
      "narrative_accuracy_unavailable"
    );
    expect(finalization.requiredBeforeFinalization).toContain(
      "Resolve narrativeAccuracy review requirements."
    );
  });

  it("does not mutate input metrics review", async () => {
    const metricsReview = await readReviewFixture();
    const before = JSON.stringify(metricsReview);

    createMetricsFinalizationFromReview({
      metricsReview,
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(JSON.stringify(metricsReview)).toBe(before);
  });

  it("allows ready status only when review readiness is true, no metrics are blocked, and evidence is not mock", async () => {
    const readyReview = readyMetricsReview();
    const finalization = createMetricsFinalizationFromReview({
      metricsReview: readyReview,
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(finalization.status).toBe("ready");
    expect(finalization.decision.allowedToGenerateMetricsJson).toBe(true);
    expect(finalization.decision.allowedToComputeAiVisibilityScore).toBe(true);
    expect(finalization.decision.allowedToGenerateScanResult).toBe(false);
  });
});

async function readReviewFixture(): Promise<MetricsReviewBundle> {
  return JSON.parse(await readFile(reviewFixturePath, "utf8")) as MetricsReviewBundle;
}

function readyMetricsReview(): MetricsReviewBundle {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    status: "review",
    sourceArtifacts: {
      metricsDraft: "metrics-draft.json"
    },
    evidenceMode: "unknown",
    readiness: {
      readyForFinalMetrics: true,
      readyForAiVisibilityScore: true,
      productionReady: true
    },
    metricReviews: {
      answerPresence: readyEntry(),
      answerShare: readyEntry(),
      entityClarity: readyEntry(),
      citationCoverage: readyEntry(),
      competitorDisplacement: readyEntry(),
      aiReadableStructure: readyEntry(),
      machineReadableTrust: readyEntry(),
      aiCitationSignals: readyEntry(),
      narrativeAccuracy: readyEntry()
    },
    blockingReasons: [],
    recommendedNextActions: ["Proceed only in a future stage that explicitly generates final metrics."],
    limitations: [
      "This artifact reviews draft metrics only.",
      "It does not produce final metrics.",
      "It does not compute aiVisibilityScore."
    ]
  };
}

function readyEntry() {
  return {
    draftAvailable: true,
    draftValueAvailable: true,
    eligibleForFinalization: true,
    decision: "ready" as const,
    reason: "Draft value is available for final metrics composition review.",
    blockingReasons: []
  };
}
