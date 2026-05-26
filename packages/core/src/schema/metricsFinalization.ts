import type { MetricsDraftEvidenceMode } from "./metricsDraft.js";
import type { MetricReviewBlockingReason, MetricsReadiness } from "./metricsReview.js";

export type MetricsFinalizationStatus = "blocked" | "ready";
export type MetricsFinalizationBlockingReason = MetricReviewBlockingReason;
export type MetricsFinalizationRecommendation = string;

export type MetricsFinalizationReadiness = MetricsReadiness;

export interface MetricsFinalizationDecision {
  allowedToGenerateMetricsJson: boolean;
  allowedToComputeAiVisibilityScore: boolean;
  allowedToGenerateScanResult: boolean;
  reason: string;
}

export interface MetricsFinalizationBlockingReasonEntry {
  code: MetricsFinalizationBlockingReason;
  severity: "low" | "medium" | "high";
  message: string;
}

export interface MetricsFinalizationBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  status: MetricsFinalizationStatus;
  sourceArtifacts: {
    metricsReview: "metrics-review.json";
  };
  evidenceMode: MetricsDraftEvidenceMode;
  readiness: MetricsFinalizationReadiness;
  decision: MetricsFinalizationDecision;
  blockingReasons: MetricsFinalizationBlockingReasonEntry[];
  requiredBeforeFinalization: MetricsFinalizationRecommendation[];
  limitations: string[];
}

const blockingReasonCodes: MetricsFinalizationBlockingReason[] = [
  "mock_evaluator_evidence",
  "missing_metric_value",
  "unavailable_metric",
  "narrative_accuracy_unavailable",
  "final_score_excluded",
  "insufficient_evidence",
  "unknown"
];

export function validateMetricsFinalizationBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["metrics finalization bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("metrics finalization bundle must not include final aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("metrics finalization bundle must not include final metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateStatus(input.status, "status", errors);
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateEvidenceMode(input.evidenceMode, "evidenceMode", errors);
  validateReadiness(input.readiness, errors);
  validateDecision(input.decision, input.readiness, input.status, errors);
  validateBlockingReasons(input.blockingReasons, errors);
  validateStringArray(input.requiredBeforeFinalization, "requiredBeforeFinalization", errors);
  validateStringArray(input.limitations, "limitations", errors);

  return errors;
}

function validateSourceArtifacts(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceArtifacts must be an object.");
    return;
  }

  validateLiteral(value.metricsReview, "metrics-review.json", "sourceArtifacts.metricsReview", errors);
}

function validateReadiness(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("readiness must be an object.");
    return;
  }

  for (const key of ["readyForFinalMetrics", "readyForAiVisibilityScore", "productionReady"]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`readiness.${key} must be a boolean.`);
    }
  }
}

function validateDecision(
  value: unknown,
  readiness: unknown,
  status: unknown,
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push("decision must be an object.");
    return;
  }

  for (const key of [
    "allowedToGenerateMetricsJson",
    "allowedToComputeAiVisibilityScore",
    "allowedToGenerateScanResult"
  ]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`decision.${key} must be a boolean.`);
    }
  }
  validateString(value.reason, "decision.reason", errors);

  if (isRecord(readiness)) {
    if (readiness.readyForFinalMetrics === false && value.allowedToGenerateMetricsJson === true) {
      errors.push(
        "decision.allowedToGenerateMetricsJson must be false when readiness.readyForFinalMetrics is false."
      );
    }
    if (
      readiness.readyForAiVisibilityScore === false &&
      value.allowedToComputeAiVisibilityScore === true
    ) {
      errors.push(
        "decision.allowedToComputeAiVisibilityScore must be false when readiness.readyForAiVisibilityScore is false."
      );
    }
  }
  if (
    value.allowedToGenerateMetricsJson === false &&
    value.allowedToGenerateScanResult === true
  ) {
    errors.push(
      "decision.allowedToGenerateScanResult must be false when decision.allowedToGenerateMetricsJson is false."
    );
  }
  if (value.allowedToGenerateScanResult === true) {
    errors.push("decision.allowedToGenerateScanResult must remain false in Stage 4C.");
  }
  if (status === "ready" && value.allowedToGenerateMetricsJson === false) {
    errors.push("status ready requires decision.allowedToGenerateMetricsJson true.");
  }
  if (status === "blocked" && value.allowedToGenerateMetricsJson === true) {
    errors.push("status blocked requires decision.allowedToGenerateMetricsJson false.");
  }
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
    if (!blockingReasonCodes.includes(reason.code as MetricsFinalizationBlockingReason)) {
      errors.push(`blockingReasons[${index}].code must be a known blocking reason.`);
    }
    if (reason.severity !== "low" && reason.severity !== "medium" && reason.severity !== "high") {
      errors.push(`blockingReasons[${index}].severity must be low, medium, or high.`);
    }
    validateString(reason.message, `blockingReasons[${index}].message`, errors);
  }
}

function validateStatus(value: unknown, fieldName: string, errors: string[]): void {
  if (value !== "blocked" && value !== "ready") {
    errors.push(`${fieldName} must be blocked or ready.`);
  }
}

function validateEvidenceMode(value: unknown, fieldName: string, errors: string[]): void {
  if (value !== "mock" && value !== "mixed" && value !== "unknown") {
    errors.push(`${fieldName} must be mock, mixed, or unknown.`);
  }
}

function validateStringArray(value: unknown, fieldName: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array.`);
  } else if (!value.every((item) => typeof item === "string")) {
    errors.push(`${fieldName} must contain only strings.`);
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
