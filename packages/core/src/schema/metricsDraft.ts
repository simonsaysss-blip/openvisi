export type MetricsDraftMetricName =
  | "answerPresence"
  | "answerShare"
  | "entityClarity"
  | "citationCoverage"
  | "competitorDisplacement"
  | "aiReadableStructure"
  | "machineReadableTrust"
  | "aiCitationSignals"
  | "narrativeAccuracy";

export type MetricsDraftEvidenceMode = "mock" | "mixed" | "unknown";
export type MetricsDraftStatus = "draft";
export type MetricsDraftLimitations = string[];

export interface MetricsDraftSourceArtifacts {
  measurementInputs: "measurement-inputs.json";
}

export interface MetricsDraftValue {
  value: number | null;
  available: boolean;
  derivedFrom: string[];
  explanation: string;
  limitations?: string[];
}

export interface MetricsDraftCompleteness {
  hasMeasurementInputs: boolean;
  hasStructureTrustInputs: boolean;
  hasAnswerSignalInputs: boolean;
  hasMockEvaluatorSignals: boolean;
  readyForFinalMetrics: boolean;
}

export interface MetricsDraftExcludedMetric {
  name: string;
  reason: string;
}

export interface MetricsDraftBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  status: MetricsDraftStatus;
  final: false;
  sourceArtifacts: MetricsDraftSourceArtifacts;
  evidenceMode: MetricsDraftEvidenceMode;
  draftMetrics: Record<MetricsDraftMetricName, MetricsDraftValue>;
  excludedMetrics: MetricsDraftExcludedMetric[];
  completeness: MetricsDraftCompleteness;
  limitations: MetricsDraftLimitations;
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

export function validateMetricsDraftBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["metrics draft bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("metrics draft bundle must not include aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("metrics draft bundle must not include final metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateLiteral(input.status, "draft", "status", errors);
  if (input.final !== false) errors.push("final must be false.");
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateEvidenceMode(input.evidenceMode, "evidenceMode", errors);
  validateDraftMetrics(input.draftMetrics, errors);
  validateExcludedMetrics(input.excludedMetrics, errors);
  validateCompleteness(input.completeness, errors);

  if (!Array.isArray(input.limitations)) {
    errors.push("limitations must be an array.");
  } else if (!input.limitations.every((limitation) => typeof limitation === "string")) {
    errors.push("limitations must contain only strings.");
  }

  return errors;
}

function validateSourceArtifacts(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceArtifacts must be an object.");
    return;
  }

  validateLiteral(
    value.measurementInputs,
    "measurement-inputs.json",
    "sourceArtifacts.measurementInputs",
    errors
  );
}

function validateDraftMetrics(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("draftMetrics must be an object.");
    return;
  }

  if ("aiVisibilityScore" in value) {
    errors.push("draftMetrics must not include aiVisibilityScore.");
  }

  for (const metricName of metricNames) {
    validateDraftMetricValue(value[metricName], `draftMetrics.${metricName}`, errors);
  }
}

function validateDraftMetricValue(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  if (value.value !== null) {
    validateRatio(value.value, `${prefix}.value`, errors);
  }
  if (typeof value.available !== "boolean") {
    errors.push(`${prefix}.available must be a boolean.`);
  }
  if (!Array.isArray(value.derivedFrom)) {
    errors.push(`${prefix}.derivedFrom must be an array.`);
  } else if (!value.derivedFrom.every((item) => typeof item === "string")) {
    errors.push(`${prefix}.derivedFrom must contain only strings.`);
  }
  validateString(value.explanation, `${prefix}.explanation`, errors);

  if (
    "limitations" in value &&
    (!Array.isArray(value.limitations) ||
      !value.limitations.every((limitation) => typeof limitation === "string"))
  ) {
    errors.push(`${prefix}.limitations must contain only strings when provided.`);
  }
}

function validateExcludedMetrics(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("excludedMetrics must be an array.");
    return;
  }

  for (const [index, metric] of value.entries()) {
    if (!isRecord(metric)) {
      errors.push(`excludedMetrics[${index}] must be an object.`);
      continue;
    }
    validateString(metric.name, `excludedMetrics[${index}].name`, errors);
    validateString(metric.reason, `excludedMetrics[${index}].reason`, errors);
  }
}

function validateCompleteness(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("completeness must be an object.");
    return;
  }

  for (const key of [
    "hasMeasurementInputs",
    "hasStructureTrustInputs",
    "hasAnswerSignalInputs",
    "hasMockEvaluatorSignals",
    "readyForFinalMetrics"
  ]) {
    if (typeof value[key] !== "boolean") {
      errors.push(`completeness.${key} must be a boolean.`);
    }
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

function validateRatio(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    errors.push(`${fieldName} must be a number between 0 and 1, or null.`);
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
