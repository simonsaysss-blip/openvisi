import type { MetricsDraftEvidenceMode, MetricsDraftMetricName } from "./metricsDraft.js";

export type MetricsReviewStatus = "review";
export type MetricReviewDecision = "ready" | "review_required" | "blocked";
export type MetricReviewBlockingReason =
  | "mock_evaluator_evidence"
  | "missing_metric_value"
  | "unavailable_metric"
  | "narrative_accuracy_unavailable"
  | "final_score_excluded"
  | "insufficient_evidence"
  | "unknown";
export type MetricReviewRecommendation = string;

export interface MetricsReadiness {
  readyForFinalMetrics: boolean;
  readyForAiVisibilityScore: boolean;
  productionReady: boolean;
}

export interface MetricReviewEntry {
  draftAvailable: boolean;
  draftValueAvailable: boolean;
  eligibleForFinalization: boolean;
  decision: MetricReviewDecision;
  reason: string;
  blockingReasons: MetricReviewBlockingReason[];
}

export interface MetricsReviewBlockingReasonEntry {
  code: MetricReviewBlockingReason;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface MetricsReviewBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  status: MetricsReviewStatus;
  sourceArtifacts: {
    metricsDraft: "metrics-draft.json";
  };
  evidenceMode: MetricsDraftEvidenceMode;
  readiness: MetricsReadiness;
  metricReviews: Record<MetricsDraftMetricName, MetricReviewEntry>;
  blockingReasons: MetricsReviewBlockingReasonEntry[];
  recommendedNextActions: MetricReviewRecommendation[];
  limitations: string[];
}

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

const blockingReasonCodes: MetricReviewBlockingReason[] = [
  "mock_evaluator_evidence",
  "missing_metric_value",
  "unavailable_metric",
  "narrative_accuracy_unavailable",
  "final_score_excluded",
  "insufficient_evidence",
  "unknown"
];

export function validateMetricsReviewBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["metrics review bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("metrics review bundle must not include final aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("metrics review bundle must not include final metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateLiteral(input.status, "review", "status", errors);
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateEvidenceMode(input.evidenceMode, "evidenceMode", errors);
  validateReadiness(input.readiness, input.evidenceMode, errors);
  validateMetricReviews(input.metricReviews, errors);
  validateBlockingReasons(input.blockingReasons, errors);
  validateStringArray(input.recommendedNextActions, "recommendedNextActions", errors);
  validateStringArray(input.limitations, "limitations", errors);

  return errors;
}

function validateSourceArtifacts(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceArtifacts must be an object.");
    return;
  }

  validateLiteral(value.metricsDraft, "metrics-draft.json", "sourceArtifacts.metricsDraft", errors);
}

function validateReadiness(
  value: unknown,
  evidenceMode: unknown,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push("readiness must be an object.");
    return;
  }

  for (const key of ["readyForFinalMetrics", "readyForAiVisibilityScore", "productionReady"]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`readiness.${key} must be a boolean.`);
    }
  }

  if (evidenceMode === "mock" && value.readyForAiVisibilityScore === true) {
    errors.push("readiness.readyForAiVisibilityScore must be false when evidenceMode is mock.");
  }
}

function validateMetricReviews(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("metricReviews must be an object.");
    return;
  }

  if ("aiVisibilityScore" in value) {
    errors.push("metricReviews must not include aiVisibilityScore.");
  }

  for (const metricName of metricNames) {
    validateMetricReviewEntry(value[metricName], `metricReviews.${metricName}`, errors);
  }
}

function validateMetricReviewEntry(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  for (const key of ["draftAvailable", "draftValueAvailable", "eligibleForFinalization"]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`${prefix}.${key} must be a boolean.`);
    }
  }
  if (
    value.decision !== "ready" &&
    value.decision !== "review_required" &&
    value.decision !== "blocked"
  ) {
    errors.push(`${prefix}.decision must be ready, review_required, or blocked.`);
  }
  validateString(value.reason, `${prefix}.reason`, errors);
  validateBlockingReasonArray(value.blockingReasons, `${prefix}.blockingReasons`, errors);
}

function validateBlockingReasons(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("blockingReasons must be an array.");
    return;
  }

  for (const [index, reason] of value.entries()) {
    if (!isRecord(reason)) {
      errors.push(`blockingReasons[${index}] must be an object.`);
      continue;
    }
    if (!blockingReasonCodes.includes(reason.code as MetricReviewBlockingReason)) {
      errors.push(`blockingReasons[${index}].code must be a known blocking reason.`);
    }
    if (reason.severity !== "low" && reason.severity !== "medium" && reason.severity !== "high") {
      errors.push(`blockingReasons[${index}].severity must be low, medium, or high.`);
    }
    validateString(reason.message, `blockingReasons[${index}].message`, errors);
  }
}

function validateBlockingReasonArray(
  value: unknown,
  fieldName: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array.`);
    return;
  }

  for (const item of value) {
    if (!blockingReasonCodes.includes(item as MetricReviewBlockingReason)) {
      errors.push(`${fieldName} must contain only known blocking reasons.`);
      return;
    }
  }
}

function validateStringArray(value: unknown, fieldName: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array.`);
  } else if (!value.every((item) => typeof item === "string")) {
    errors.push(`${fieldName} must contain only strings.`);
  }
}

function validateEvidenceMode(value: unknown, fieldName: string, errors: string[]): void {
  if (value !== "mock" && value !== "mixed" && value !== "unknown") {
    errors.push(`${fieldName} must be mock, mixed, or unknown.`);
  }
}

function validateLiteral(
  value: unknown,
  expected: string,
  fieldName: string,
  errors: string[]
): void {
  if (value !== expected) errors.push(`${fieldName} must be "${expected}".`);
}

function validateIsoString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    errors.push(`${fieldName} must be an ISO date string.`);
  }
}

function validateString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} must be a non-empty string.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
