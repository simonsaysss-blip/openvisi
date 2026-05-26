import { describe, expect, it } from "vitest";
import { validateAnswerSignalInputBundleShape } from "./answerSignalInputs.js";
import type { AnswerSignalInputBundle } from "./answerSignalInputs.js";

describe("AnswerSignalInputBundle contract", () => {
  it("accepts a valid bundle", () => {
    expect(validateAnswerSignalInputBundleShape(validBundle())).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateAnswerSignalInputBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        "sourceArtifacts must be an object.",
        "provider must be a known evaluator provider name.",
        "model must be a non-empty string.",
        "answerCount must be a non-negative number."
      ])
    );
  });

  it("rejects aiVisibilityScore because this is not a metrics artifact", () => {
    expect(validateAnswerSignalInputBundleShape({ ...validBundle(), aiVisibilityScore: 91 })).toContain(
      "answer signal input bundle must not include aiVisibilityScore."
    );
  });
});

function validBundle(): AnswerSignalInputBundle {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sourceArtifacts: {
      answers: "answers.json",
      promptPack: "prompt-pack.json",
      config: "config.normalized.json"
    },
    provider: "mock",
    model: "mock-v0",
    answerCount: 1,
    answerPresenceSignals: {
      targetBrandMentions: 1,
      answersWithTargetBrand: 1,
      answersWithoutTargetBrand: 0
    },
    entityClaritySignals: {
      answersWithCategoryTerms: 1,
      answersWithDomainTerms: 0,
      answersWithAudienceTerms: 0,
      possibleAmbiguityCount: 0
    },
    citationCoverageSignals: {
      answersWithCitations: 0,
      answersWithTargetDomainCitation: 0,
      totalCitationCount: 0,
      targetDomainCitationCount: 0
    },
    competitorDisplacementSignals: {
      answersMentioningCompetitors: 0,
      answersMentioningCompetitorsWithoutTargetBrand: 0,
      competitorMentionCounts: {}
    },
    narrativeAccuracySignals: {
      answersWithUnsupportedClaims: 0,
      answersMarkedAsMock: 1,
      requiresHumanReview: true
    },
    promptResults: [
      {
        promptId: "brand-specific-what-is-openvisi",
        targetBrandMentioned: true,
        competitorsMentioned: [],
        citationCount: 0,
        targetDomainCited: false,
        mockAnswer: true
      }
    ],
    limitations: [
      "Derived from evaluator answer artifacts only.",
      "Does not compute final AI Visibility metrics.",
      "Mock answers are not real LLM outputs."
    ]
  };
}
