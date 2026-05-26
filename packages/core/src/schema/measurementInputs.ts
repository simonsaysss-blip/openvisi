import type { AnswerSignalInputBundle } from "./answerSignalInputs.js";
import { validateAnswerSignalInputBundleShape } from "./answerSignalInputs.js";
import type { ArtifactBundleStage } from "./artifacts.js";
import type { EvaluatorProviderName } from "./evaluator.js";
import type { StructureTrustInputBundle } from "./structureTrustInputs.js";
import { validateStructureTrustInputBundleShape } from "./structureTrustInputs.js";

export interface MeasurementInputSourceBundleRef {
  path: string;
  stage: Extract<ArtifactBundleStage, "static-crawl" | "evaluation">;
}

export interface MeasurementInputSourceBundles {
  staticCrawl: MeasurementInputSourceBundleRef;
  evaluation: MeasurementInputSourceBundleRef;
}

export interface MeasurementInputSourceArtifacts {
  structureTrustInputs: "structure-trust-inputs.json";
  answerSignalInputs: "answer-signal-inputs.json";
}

export interface MeasurementInputCompleteness {
  hasStructureTrustInputs: boolean;
  hasAnswerSignalInputs: boolean;
  hasCrawlerEvidence: boolean;
  hasEvaluatorEvidence: boolean;
  readyForMetricsComposition: boolean;
}

export interface MeasurementEvidenceSummary {
  pageCount: number;
  answerCount: number;
  provider: EvaluatorProviderName;
  model: string;
}

export type MeasurementInputLimitations = string[];

export interface MeasurementInputBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  sourceBundles: MeasurementInputSourceBundles;
  sourceArtifacts: MeasurementInputSourceArtifacts;
  inputCompleteness: MeasurementInputCompleteness;
  evidenceSummary: MeasurementEvidenceSummary;
  structureTrustInputs: StructureTrustInputBundle;
  answerSignalInputs: AnswerSignalInputBundle;
  limitations: MeasurementInputLimitations;
}

export function createMeasurementInputBundle(input: {
  generatedAt?: string;
  staticCrawlBundlePath: string;
  evaluationBundlePath: string;
  structureTrustInputs: StructureTrustInputBundle;
  answerSignalInputs: AnswerSignalInputBundle;
}): MeasurementInputBundle {
  const hasStructureTrustInputs = input.structureTrustInputs.pageCount >= 0;
  const hasAnswerSignalInputs = input.answerSignalInputs.answerCount >= 0;
  const mockEvaluation = input.answerSignalInputs.provider === "mock";

  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sourceBundles: {
      staticCrawl: {
        path: input.staticCrawlBundlePath,
        stage: "static-crawl"
      },
      evaluation: {
        path: input.evaluationBundlePath,
        stage: "evaluation"
      }
    },
    sourceArtifacts: {
      structureTrustInputs: "structure-trust-inputs.json",
      answerSignalInputs: "answer-signal-inputs.json"
    },
    inputCompleteness: {
      hasStructureTrustInputs,
      hasAnswerSignalInputs,
      hasCrawlerEvidence: input.structureTrustInputs.pageCount > 0,
      hasEvaluatorEvidence: input.answerSignalInputs.answerCount > 0,
      readyForMetricsComposition: hasStructureTrustInputs && hasAnswerSignalInputs
    },
    evidenceSummary: {
      pageCount: input.structureTrustInputs.pageCount,
      answerCount: input.answerSignalInputs.answerCount,
      provider: input.answerSignalInputs.provider,
      model: input.answerSignalInputs.model
    },
    structureTrustInputs: input.structureTrustInputs,
    answerSignalInputs: input.answerSignalInputs,
    limitations: [
      "This bundle combines input artifacts only.",
      "It does not compute final AI Visibility metrics.",
      "It does not include aiVisibilityScore.",
      ...(mockEvaluation ? ["Mock evaluation outputs are not real LLM evidence."] : [])
    ]
  };
}

export function validateMeasurementInputBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["measurement input bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("measurement input bundle must not include aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("measurement input bundle must not include metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateSourceBundles(input.sourceBundles, errors);
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateInputCompleteness(input.inputCompleteness, errors);
  validateEvidenceSummary(input.evidenceSummary, errors);

  if (!isRecord(input.structureTrustInputs)) {
    errors.push("structureTrustInputs must be an object.");
  } else {
    errors.push(
      ...validateStructureTrustInputBundleShape(input.structureTrustInputs).map(
        (error) => `structureTrustInputs.${error}`
      )
    );
  }
  if (!isRecord(input.answerSignalInputs)) {
    errors.push("answerSignalInputs must be an object.");
  } else {
    errors.push(
      ...validateAnswerSignalInputBundleShape(input.answerSignalInputs).map(
        (error) => `answerSignalInputs.${error}`
      )
    );
  }
  if (!Array.isArray(input.limitations)) {
    errors.push("limitations must be an array.");
  } else if (!input.limitations.every((limitation) => typeof limitation === "string")) {
    errors.push("limitations must contain only strings.");
  }

  return errors;
}

function validateSourceBundles(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceBundles must be an object.");
    return;
  }

  validateBundleRef(value.staticCrawl, "sourceBundles.staticCrawl", "static-crawl", errors);
  validateBundleRef(value.evaluation, "sourceBundles.evaluation", "evaluation", errors);
}

function validateBundleRef(
  value: unknown,
  fieldName: string,
  expectedStage: "static-crawl" | "evaluation",
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${fieldName} must be an object.`);
    return;
  }

  validateString(value.path, `${fieldName}.path`, errors);
  validateLiteral(value.stage, expectedStage, `${fieldName}.stage`, errors);
}

function validateSourceArtifacts(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("sourceArtifacts must be an object.");
    return;
  }

  validateLiteral(
    value.structureTrustInputs,
    "structure-trust-inputs.json",
    "sourceArtifacts.structureTrustInputs",
    errors
  );
  validateLiteral(
    value.answerSignalInputs,
    "answer-signal-inputs.json",
    "sourceArtifacts.answerSignalInputs",
    errors
  );
}

function validateInputCompleteness(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("inputCompleteness must be an object.");
    return;
  }

  for (const key of [
    "hasStructureTrustInputs",
    "hasAnswerSignalInputs",
    "hasCrawlerEvidence",
    "hasEvaluatorEvidence",
    "readyForMetricsComposition"
  ]) {
    validateBoolean(value[key], `inputCompleteness.${key}`, errors);
  }
}

function validateEvidenceSummary(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("evidenceSummary must be an object.");
    return;
  }

  validateNumber(value.pageCount, "evidenceSummary.pageCount", errors);
  validateNumber(value.answerCount, "evidenceSummary.answerCount", errors);
  validateProviderName(value.provider, "evidenceSummary.provider", errors);
  validateString(value.model, "evidenceSummary.model", errors);
}

function validateProviderName(value: unknown, fieldName: string, errors: string[]): void {
  if (
    value !== "mock" &&
    value !== "openai" &&
    value !== "anthropic" &&
    value !== "google" &&
    value !== "custom"
  ) {
    errors.push(`${fieldName} must be a known evaluator provider name.`);
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

function validateNumber(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push(`${fieldName} must be a non-negative number.`);
  }
}

function validateBoolean(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "boolean") errors.push(`${fieldName} must be a boolean.`);
}

function validateString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} must be a non-empty string.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
