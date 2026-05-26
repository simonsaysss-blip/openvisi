import type { MetricsReviewBundle } from "./schema/metricsReview.js";
import type {
  MetricsFinalizationBlockingReason,
  MetricsFinalizationBlockingReasonEntry,
  MetricsFinalizationBundle
} from "./schema/metricsFinalization.js";

export function createMetricsFinalizationFromReview(input: {
  metricsReview: MetricsReviewBundle;
  generatedAt?: string;
}): MetricsFinalizationBundle {
  const metricsReview = input.metricsReview;
  const blockingCodes = collectBlockingCodes(metricsReview);
  const ready =
    metricsReview.readiness.readyForFinalMetrics &&
    metricsReview.readiness.readyForAiVisibilityScore &&
    metricsReview.readiness.productionReady &&
    metricsReview.evidenceMode !== "mock" &&
    blockingCodes.length === 0;
  const status = ready ? "ready" : "blocked";

  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    status,
    sourceArtifacts: {
      metricsReview: "metrics-review.json"
    },
    evidenceMode: metricsReview.evidenceMode,
    readiness: {
      readyForFinalMetrics: metricsReview.readiness.readyForFinalMetrics,
      readyForAiVisibilityScore: metricsReview.readiness.readyForAiVisibilityScore,
      productionReady: metricsReview.readiness.productionReady
    },
    decision: {
      allowedToGenerateMetricsJson: ready,
      allowedToComputeAiVisibilityScore: ready,
      allowedToGenerateScanResult: false,
      reason: decisionReason(status, metricsReview)
    },
    blockingReasons: blockingCodes.map((code) => blockingReasonEntry(code)),
    requiredBeforeFinalization: createRequiredBeforeFinalization(blockingCodes, metricsReview),
    limitations: [
      "This artifact is a finalization guard only.",
      "It does not produce metrics.json.",
      "It does not compute aiVisibilityScore.",
      "It does not produce scan-result.json."
    ]
  };
}

function collectBlockingCodes(metricsReview: MetricsReviewBundle): MetricsFinalizationBlockingReason[] {
  const codes = new Set<MetricsFinalizationBlockingReason>();

  if (metricsReview.evidenceMode === "mock") {
    codes.add("mock_evaluator_evidence");
  }
  if (!metricsReview.readiness.readyForFinalMetrics || !metricsReview.readiness.productionReady) {
    codes.add("insufficient_evidence");
  }
  if (!metricsReview.readiness.readyForAiVisibilityScore) {
    codes.add("final_score_excluded");
  }
  for (const reason of metricsReview.blockingReasons) {
    codes.add(reason.code);
  }
  for (const [metricName, review] of Object.entries(metricsReview.metricReviews)) {
    if (review.decision === "blocked") {
      for (const reason of review.blockingReasons) {
        codes.add(reason);
      }
      if (metricName === "narrativeAccuracy") {
        codes.add("narrative_accuracy_unavailable");
      }
    }
  }

  return [...codes];
}

function decisionReason(status: "blocked" | "ready", metricsReview: MetricsReviewBundle): string {
  if (status === "ready") {
    return "Metrics review allows future final metrics generation.";
  }
  if (metricsReview.evidenceMode === "mock") {
    return "Metrics review blocked finalization under mock evaluator evidence.";
  }
  return "Metrics review did not pass finalization readiness requirements.";
}

function createRequiredBeforeFinalization(
  blockingCodes: MetricsFinalizationBlockingReason[],
  metricsReview: MetricsReviewBundle
): string[] {
  const codes = new Set(blockingCodes);
  const actions: string[] = [];

  if (codes.has("mock_evaluator_evidence")) {
    actions.push("Run evaluator against real provider adapters.");
  }
  if (codes.has("narrative_accuracy_unavailable")) {
    actions.push("Resolve narrativeAccuracy review requirements.");
  }
  if (
    !metricsReview.readiness.readyForFinalMetrics ||
    !metricsReview.readiness.readyForAiVisibilityScore ||
    !metricsReview.readiness.productionReady
  ) {
    actions.push("Ensure metrics review readiness is true.");
  }
  if (actions.length === 0) {
    actions.push("Proceed only in a future stage that explicitly generates final metrics.");
  }

  return actions;
}

function blockingReasonEntry(
  code: MetricsFinalizationBlockingReason
): MetricsFinalizationBlockingReasonEntry {
  switch (code) {
    case "mock_evaluator_evidence":
      return {
        code,
        severity: "high",
        message: "Mock evaluator evidence is not real LLM evidence."
      };
    case "final_score_excluded":
      return {
        code,
        severity: "high",
        message: "Final AI Visibility Score is not allowed by the finalization guard."
      };
    case "narrative_accuracy_unavailable":
      return {
        code,
        severity: "high",
        message: "narrativeAccuracy requires real LLM evidence or human review."
      };
    case "insufficient_evidence":
      return {
        code,
        severity: "high",
        message: "Metrics review readiness is insufficient for final metrics generation."
      };
    case "missing_metric_value":
      return {
        code,
        severity: "medium",
        message: "One or more reviewed metrics do not have a draft value."
      };
    case "unavailable_metric":
      return {
        code,
        severity: "medium",
        message: "One or more reviewed metrics are unavailable."
      };
    case "unknown":
      return {
        code,
        severity: "low",
        message: "An unknown finalization blocker was detected."
      };
  }
}
