import type {
  MetricsDraftBundle,
  MetricsDraftMetricName,
  MetricsDraftValue
} from "./schema/metricsDraft.js";
import type {
  MetricReviewBlockingReason,
  MetricReviewEntry,
  MetricsReviewBlockingReasonEntry,
  MetricsReviewBundle
} from "./schema/metricsReview.js";

const evaluatorDerivedMetrics = new Set<MetricsDraftMetricName>([
  "answerPresence",
  "answerShare",
  "entityClarity",
  "citationCoverage",
  "competitorDisplacement",
  "narrativeAccuracy"
]);

const metricNames: MetricsDraftMetricName[] = [
  "answerPresence",
  "answerShare",
  "entityClarity",
  "citationCoverage",
  "competitorDisplacement",
  "aiReadableStructure",
  "machineReadableTrust",
  "aiCitationSignals",
  "narrativeAccuracy"
];

export function createMetricsReviewFromDraft(input: {
  metricsDraft: MetricsDraftBundle;
  generatedAt?: string;
}): MetricsReviewBundle {
  const metricReviews = Object.fromEntries(
    metricNames.map((metricName) => [
      metricName,
      reviewMetric(metricName, input.metricsDraft.draftMetrics[metricName], input.metricsDraft)
    ])
  ) as Record<MetricsDraftMetricName, MetricReviewEntry>;
  const blockingReasons = createBlockingReasons(input.metricsDraft, metricReviews);

  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    status: "review",
    sourceArtifacts: {
      metricsDraft: "metrics-draft.json"
    },
    evidenceMode: input.metricsDraft.evidenceMode,
    readiness: {
      readyForFinalMetrics: false,
      readyForAiVisibilityScore: false,
      productionReady: false
    },
    metricReviews,
    blockingReasons,
    recommendedNextActions: createRecommendedNextActions(blockingReasons),
    limitations: [
      "This artifact reviews draft metrics only.",
      "It does not produce final metrics.",
      "It does not compute aiVisibilityScore."
    ]
  };
}

function reviewMetric(
  metricName: MetricsDraftMetricName,
  draftMetric: MetricsDraftValue | undefined,
  metricsDraft: MetricsDraftBundle
): MetricReviewEntry {
  const draftAvailable = Boolean(draftMetric);
  const draftValueAvailable = Boolean(draftMetric?.available && draftMetric.value !== null);
  const blockingReasons: MetricReviewBlockingReason[] = [];

  if (!draftAvailable) {
    blockingReasons.push("missing_metric_value");
  }
  if (draftAvailable && !draftMetric?.available) {
    blockingReasons.push("unavailable_metric");
  }
  if (draftAvailable && draftMetric?.value === null) {
    blockingReasons.push("missing_metric_value");
  }
  if (metricName === "narrativeAccuracy" && !draftValueAvailable) {
    blockingReasons.push("narrative_accuracy_unavailable");
  }
  if (metricsDraft.evidenceMode === "mock" && evaluatorDerivedMetrics.has(metricName)) {
    blockingReasons.push("mock_evaluator_evidence");
  }

  if (blockingReasons.length > 0) {
    return {
      draftAvailable,
      draftValueAvailable,
      eligibleForFinalization: false,
      decision: "blocked",
      reason: reasonFor(metricName, blockingReasons),
      blockingReasons: unique(blockingReasons)
    };
  }

  if (!evaluatorDerivedMetrics.has(metricName)) {
    return {
      draftAvailable,
      draftValueAvailable,
      eligibleForFinalization: true,
      decision: "review_required",
      reason:
        "Crawler-derived draft value is available and requires review before final metrics composition.",
      blockingReasons: []
    };
  }

  return {
    draftAvailable,
    draftValueAvailable,
    eligibleForFinalization: true,
    decision: "ready",
    reason: "Draft value is available for final metrics composition review.",
    blockingReasons: []
  };
}

function reasonFor(
  metricName: MetricsDraftMetricName,
  blockingReasons: MetricReviewBlockingReason[]
): string {
  if (blockingReasons.includes("mock_evaluator_evidence")) {
    return "Derived from mock evaluator evidence.";
  }
  if (metricName === "narrativeAccuracy") {
    return "narrativeAccuracy requires real LLM evidence or human review.";
  }
  if (blockingReasons.includes("unavailable_metric")) {
    return "Draft metric is unavailable.";
  }
  if (blockingReasons.includes("missing_metric_value")) {
    return "Draft metric value is missing.";
  }
  return "Draft metric requires additional evidence.";
}

function createBlockingReasons(
  metricsDraft: MetricsDraftBundle,
  metricReviews: Record<MetricsDraftMetricName, MetricReviewEntry>
): MetricsReviewBlockingReasonEntry[] {
  const codes = new Set<MetricReviewBlockingReason>();

  if (metricsDraft.evidenceMode === "mock") {
    codes.add("mock_evaluator_evidence");
  }
  if (metricsDraft.excludedMetrics.some((metric) => metric.name === "aiVisibilityScore")) {
    codes.add("final_score_excluded");
  }
  for (const review of Object.values(metricReviews)) {
    for (const reason of review.blockingReasons) {
      codes.add(reason);
    }
  }

  return [...codes].map((code) => blockingReasonEntry(code));
}

function blockingReasonEntry(code: MetricReviewBlockingReason): MetricsReviewBlockingReasonEntry {
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
        message: "Final AI Visibility Score is excluded from draft and review stages."
      };
    case "narrative_accuracy_unavailable":
      return {
        code,
        severity: "high",
        message: "narrativeAccuracy requires real LLM evidence or human review."
      };
    case "missing_metric_value":
      return {
        code,
        severity: "medium",
        message: "One or more draft metrics do not have a value."
      };
    case "unavailable_metric":
      return {
        code,
        severity: "medium",
        message: "One or more draft metrics are unavailable."
      };
    case "insufficient_evidence":
      return {
        code,
        severity: "medium",
        message: "Available evidence is insufficient for final metrics composition."
      };
    case "unknown":
      return {
        code,
        severity: "low",
        message: "An unknown review blocker was detected."
      };
  }
}

function createRecommendedNextActions(
  blockingReasons: MetricsReviewBlockingReasonEntry[]
): string[] {
  const codes = new Set(blockingReasons.map((reason) => reason.code));
  const actions: string[] = [];

  if (codes.has("mock_evaluator_evidence")) {
    actions.push("Run evaluator against real provider adapters before final scoring.");
  }
  if (codes.has("narrative_accuracy_unavailable")) {
    actions.push("Add real LLM evidence or human review before finalizing narrativeAccuracy.");
  }
  if (codes.has("final_score_excluded")) {
    actions.push("Keep aiVisibilityScore excluded until final metrics readiness gates pass.");
  }
  if (actions.length === 0) {
    actions.push("Review draft metrics and evidence quality before final metrics composition.");
  }

  return actions;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
