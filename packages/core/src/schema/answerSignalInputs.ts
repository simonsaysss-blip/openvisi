import type { EvaluatorProviderName } from "./evaluator.js";

export interface AnswerSignalSourceArtifacts {
  answers: "answers.json";
  promptPack: "prompt-pack.json";
  config: "config.normalized.json";
}

export interface AnswerPresenceSignals {
  targetBrandMentions: number;
  answersWithTargetBrand: number;
  answersWithoutTargetBrand: number;
}

export interface EntityClaritySignals {
  answersWithCategoryTerms: number;
  answersWithDomainTerms: number;
  answersWithAudienceTerms: number;
  possibleAmbiguityCount: number;
}

export interface CitationCoverageSignals {
  answersWithCitations: number;
  answersWithTargetDomainCitation: number;
  totalCitationCount: number;
  targetDomainCitationCount: number;
}

export interface CompetitorDisplacementSignals {
  answersMentioningCompetitors: number;
  answersMentioningCompetitorsWithoutTargetBrand: number;
  competitorMentionCounts: Record<string, number>;
}

export interface NarrativeAccuracySignals {
  answersWithUnsupportedClaims: number;
  answersMarkedAsMock: number;
  requiresHumanReview: boolean;
}

export interface AnswerSignalPromptResult {
  promptId: string;
  targetBrandMentioned: boolean;
  competitorsMentioned: string[];
  citationCount: number;
  targetDomainCited: boolean;
  mockAnswer: boolean;
}

export type AnswerSignalLimitation = string;

export interface AnswerSignalInputBundle {
  schemaVersion: "0.1";
  generatedAt: string;
  sourceArtifacts: AnswerSignalSourceArtifacts;
  provider: EvaluatorProviderName;
  model: string;
  answerCount: number;
  answerPresenceSignals: AnswerPresenceSignals;
  entityClaritySignals: EntityClaritySignals;
  citationCoverageSignals: CitationCoverageSignals;
  competitorDisplacementSignals: CompetitorDisplacementSignals;
  narrativeAccuracySignals: NarrativeAccuracySignals;
  promptResults: AnswerSignalPromptResult[];
  limitations: AnswerSignalLimitation[];
}

export function validateAnswerSignalInputBundleShape(input: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(input)) return ["answer signal input bundle must be an object."];

  if ("aiVisibilityScore" in input) {
    errors.push("answer signal input bundle must not include aiVisibilityScore.");
  }
  if ("metrics" in input) {
    errors.push("answer signal input bundle must not include metrics.");
  }

  validateLiteral(input.schemaVersion, "0.1", "schemaVersion", errors);
  validateIsoString(input.generatedAt, "generatedAt", errors);
  validateSourceArtifacts(input.sourceArtifacts, errors);
  validateProviderName(input.provider, "provider", errors);
  validateString(input.model, "model", errors);
  validateNumber(input.answerCount, "answerCount", errors);
  validateAnswerPresenceSignals(input.answerPresenceSignals, errors);
  validateEntityClaritySignals(input.entityClaritySignals, errors);
  validateCitationCoverageSignals(input.citationCoverageSignals, errors);
  validateCompetitorDisplacementSignals(input.competitorDisplacementSignals, errors);
  validateNarrativeAccuracySignals(input.narrativeAccuracySignals, errors);
  validatePromptResults(input.promptResults, errors);

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

  validateLiteral(value.answers, "answers.json", "sourceArtifacts.answers", errors);
  validateLiteral(value.promptPack, "prompt-pack.json", "sourceArtifacts.promptPack", errors);
  validateLiteral(value.config, "config.normalized.json", "sourceArtifacts.config", errors);
}

function validateAnswerPresenceSignals(value: unknown, errors: string[]): void {
  validateNumberObject(
    value,
    "answerPresenceSignals",
    ["targetBrandMentions", "answersWithTargetBrand", "answersWithoutTargetBrand"],
    errors
  );
}

function validateEntityClaritySignals(value: unknown, errors: string[]): void {
  validateNumberObject(
    value,
    "entityClaritySignals",
    [
      "answersWithCategoryTerms",
      "answersWithDomainTerms",
      "answersWithAudienceTerms",
      "possibleAmbiguityCount"
    ],
    errors
  );
}

function validateCitationCoverageSignals(value: unknown, errors: string[]): void {
  validateNumberObject(
    value,
    "citationCoverageSignals",
    [
      "answersWithCitations",
      "answersWithTargetDomainCitation",
      "totalCitationCount",
      "targetDomainCitationCount"
    ],
    errors
  );
}

function validateCompetitorDisplacementSignals(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("competitorDisplacementSignals must be an object.");
    return;
  }

  validateNumber(
    value.answersMentioningCompetitors,
    "competitorDisplacementSignals.answersMentioningCompetitors",
    errors
  );
  validateNumber(
    value.answersMentioningCompetitorsWithoutTargetBrand,
    "competitorDisplacementSignals.answersMentioningCompetitorsWithoutTargetBrand",
    errors
  );
  if (!isRecord(value.competitorMentionCounts)) {
    errors.push("competitorDisplacementSignals.competitorMentionCounts must be an object.");
  } else {
    for (const [competitor, count] of Object.entries(value.competitorMentionCounts)) {
      validateString(competitor, "competitorDisplacementSignals.competitorMentionCounts key", errors);
      validateNumber(
        count,
        `competitorDisplacementSignals.competitorMentionCounts.${competitor}`,
        errors
      );
    }
  }
}

function validateNarrativeAccuracySignals(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push("narrativeAccuracySignals must be an object.");
    return;
  }

  validateNumber(
    value.answersWithUnsupportedClaims,
    "narrativeAccuracySignals.answersWithUnsupportedClaims",
    errors
  );
  validateNumber(value.answersMarkedAsMock, "narrativeAccuracySignals.answersMarkedAsMock", errors);
  if (typeof value.requiresHumanReview !== "boolean") {
    errors.push("narrativeAccuracySignals.requiresHumanReview must be a boolean.");
  }
}

function validatePromptResults(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push("promptResults must be an array.");
    return;
  }

  for (const [index, result] of value.entries()) {
    if (!isRecord(result)) {
      errors.push(`promptResults[${index}] must be an object.`);
      continue;
    }

    validateString(result.promptId, `promptResults[${index}].promptId`, errors);
    validateBoolean(result.targetBrandMentioned, `promptResults[${index}].targetBrandMentioned`, errors);
    if (!Array.isArray(result.competitorsMentioned)) {
      errors.push(`promptResults[${index}].competitorsMentioned must be an array.`);
    } else if (!result.competitorsMentioned.every((competitor) => typeof competitor === "string")) {
      errors.push(`promptResults[${index}].competitorsMentioned must contain only strings.`);
    }
    validateNumber(result.citationCount, `promptResults[${index}].citationCount`, errors);
    validateBoolean(result.targetDomainCited, `promptResults[${index}].targetDomainCited`, errors);
    validateBoolean(result.mockAnswer, `promptResults[${index}].mockAnswer`, errors);
  }
}

function validateNumberObject(
  value: unknown,
  objectName: string,
  keys: string[],
  errors: string[]
): void {
  if (!isRecord(value)) {
    errors.push(`${objectName} must be an object.`);
    return;
  }

  for (const key of keys) {
    validateNumber(value[key], `${objectName}.${key}`, errors);
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
