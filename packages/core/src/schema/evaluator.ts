import type { LLMAnswer, OpenVisiScanConfig, PromptSpec } from "./scan.js";

export type EvaluatorProviderName = "mock" | "openai" | "anthropic" | "google" | "custom";

export interface GenerateAnswerInput {
  prompt: PromptSpec;
  brandName: string;
  domain: string;
  category: string;
  competitors?: string[];
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface GenerateAnswerOptions {
  provider: EvaluatorProviderName;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProviderAdapter {
  name: EvaluatorProviderName;
  generateAnswer(input: GenerateAnswerInput, options?: GenerateAnswerOptions): Promise<LLMAnswer>;
}

export interface EvaluatorRunInput {
  config: OpenVisiScanConfig;
  provider: LLMProviderAdapter;
  options?: GenerateAnswerOptions;
}

export interface EvaluatorRunResult {
  answers: LLMAnswer[];
  warnings: string[];
}

export interface AnswersArtifactSource {
  promptPack: string;
  config: string;
}

export interface AnswersArtifact {
  schemaVersion: "0.1";
  generatedAt: string;
  source: AnswersArtifactSource;
  provider: EvaluatorProviderName;
  model: string;
  answers: LLMAnswer[];
}

export function validateAnswersArtifactShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["answers artifact must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("answers artifact must not include aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("answers artifact must not include metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateSource(input.source, errors);
  validateProviderName(input.provider, "provider", errors);
  validateString(input.model, "model", errors);

  if (!Array.isArray(input.answers)) {
    errors.push("answers must be an array.");
  } else {
    for (const [index, answer] of input.answers.entries()) {
      validateAnswer(answer, `answers[${index}]`, errors);
    }
  }

  return errors;
}

function validateSource(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("source must be an object.");
    return;
  }

  validateString(value.promptPack, "source.promptPack", errors);
  validateString(value.config, "source.config", errors);
}

function validateAnswer(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  validateString(value.promptId, `${prefix}.promptId`, errors);
  validateString(value.provider, `${prefix}.provider`, errors);
  validateString(value.model, `${prefix}.model`, errors);
  validateString(value.answerText, `${prefix}.answerText`, errors);
  validateIsoString(value.createdAt, `${prefix}.createdAt`, errors);

  if (!Array.isArray(value.citations)) {
    errors.push(`${prefix}.citations must be an array.`);
  } else {
    for (const [index, citation] of value.citations.entries()) {
      validateCitation(citation, `${prefix}.citations[${index}]`, errors);
    }
  }
}

function validateCitation(value: unknown, prefix: string, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push(`${prefix} must be an object.`);
    return;
  }

  validateString(value.url, `${prefix}.url`, errors);
  if (value.title !== undefined) validateString(value.title, `${prefix}.title`, errors);
  if (value.sourceDomain !== undefined) {
    validateString(value.sourceDomain, `${prefix}.sourceDomain`, errors);
  }
  if (
    value.confidence !== undefined &&
    (typeof value.confidence !== "number" ||
      !Number.isFinite(value.confidence) ||
      value.confidence < 0 ||
      value.confidence > 1)
  ) {
    errors.push(`${prefix}.confidence must be a number between 0 and 1.`);
  }
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
  if (value !== expected) {
    errors.push(`${fieldName} must be "${expected}".`);
  }
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
