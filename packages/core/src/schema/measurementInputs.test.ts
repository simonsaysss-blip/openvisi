import { describe, expect, it } from "vitest";
import {
  createMeasurementInputBundle,
  validateMeasurementInputBundleShape,
  type MeasurementInputBundle
} from "./measurementInputs.js";
import type { AnswerSignalInputBundle } from "./answerSignalInputs.js";
import type { StructureTrustInputBundle } from "./structureTrustInputs.js";

describe("MeasurementInputBundle contract", () => {
  it("accepts a valid bundle", () => {
    expect(validateMeasurementInputBundleShape(validBundle())).toEqual([]);
  });

  it("creates a deterministic input bundle from upstream inputs", () => {
    const bundle = createMeasurementInputBundle({
      generatedAt: "2026-01-01T00:00:00.000Z",
      staticCrawlBundlePath: "../static-crawl",
      evaluationBundlePath: "../evaluation",
      structureTrustInputs: structureTrustInputs(),
      answerSignalInputs: answerSignalInputs()
    });

    expect(bundle).toMatchObject({
      schemaVersion: "0.1",
      generatedAt: "2026-01-01T00:00:00.000Z",
      sourceBundles: {
        staticCrawl: { path: "../static-crawl", stage: "static-crawl" },
        evaluation: { path: "../evaluation", stage: "evaluation" }
      },
      inputCompleteness: {
        hasStructureTrustInputs: true,
        hasAnswerSignalInputs: true,
        hasCrawlerEvidence: true,
        hasEvaluatorEvidence: true,
        readyForMetricsComposition: true
      },
      evidenceSummary: {
        pageCount: 2,
        answerCount: 2,
        provider: "mock",
        model: "mock-v0"
      }
    });
    expect(validateMeasurementInputBundleShape(bundle)).toEqual([]);
  });

  it("rejects missing required top-level fields", () => {
    expect(validateMeasurementInputBundleShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        "sourceBundles must be an object.",
        "sourceArtifacts must be an object.",
        "inputCompleteness must be an object.",
        "evidenceSummary must be an object."
      ])
    );
  });

  it("rejects aiVisibilityScore because this is not a metrics artifact", () => {
    expect(validateMeasurementInputBundleShape({ ...validBundle(), aiVisibilityScore: 91 })).toContain(
      "measurement input bundle must not include aiVisibilityScore."
    );
  });

  it("rejects metrics because this is only an input bundle", () => {
    expect(validateMeasurementInputBundleShape({ ...validBundle(), metrics: {} })).toContain(
      "measurement input bundle must not include metrics."
    );
  });
});

function validBundle(): MeasurementInputBundle {
  return createMeasurementInputBundle({
    generatedAt: "2026-01-01T00:00:00.000Z",
    staticCrawlBundlePath: "../static-crawl",
    evaluationBundlePath: "../evaluation",
    structureTrustInputs: structureTrustInputs(),
    answerSignalInputs: answerSignalInputs()
  });
}

function structureTrustInputs(): StructureTrustInputBundle {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    sourceArtifacts: {
      crawledPages: "crawled-pages.json",
      crawlerSummary: "crawler-summary.json"
    },
    pageCount: 2,
    aiReadableStructureSignals: {
      pagesWithClearH1: 2,
      pagesWithDocsLikeStructure: 1,
      pagesWithFAQSection: 1,
      pagesWithComparisonSignals: 0,
      averageContentDepthEstimate: 420
    },
    machineReadableTrustSignals: {
      pagesWithJsonLd: 1,
      pagesWithOrganizationSchema: 1,
      pagesWithProductSchema: 0,
      pagesWithFAQSchema: 1,
      pagesWithAuthorMetadata: 0,
      pagesWithLastModifiedMetadata: 0,
      pagesWithCanonical: 2,
      httpsPages: 2
    },
    aiCitationSignalInputs: {
      hasOfficialStructuredData: true,
      hasDocumentationLikeSources: true,
      hasFAQLikeSources: true,
      hasComparisonLikeSources: false,
      preferredSourceDomains: ["openvisi.dev"]
    },
    sourceGapCandidates: [],
    limitations: [
      "Derived from static crawler output only.",
      "Does not include LLM-generated answers or citation behavior."
    ]
  };
}

function answerSignalInputs(): AnswerSignalInputBundle {
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
    answerCount: 2,
    answerPresenceSignals: {
      targetBrandMentions: 2,
      answersWithTargetBrand: 2,
      answersWithoutTargetBrand: 0
    },
    entityClaritySignals: {
      answersWithCategoryTerms: 2,
      answersWithDomainTerms: 1,
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
      answersMentioningCompetitors: 1,
      answersMentioningCompetitorsWithoutTargetBrand: 0,
      competitorMentionCounts: { "Example Competitor": 1 }
    },
    narrativeAccuracySignals: {
      answersWithUnsupportedClaims: 0,
      answersMarkedAsMock: 2,
      requiresHumanReview: true
    },
    promptResults: [
      {
        promptId: "category-discovery-001",
        targetBrandMentioned: true,
        competitorsMentioned: ["Example Competitor"],
        citationCount: 0,
        targetDomainCited: false,
        mockAnswer: true
      },
      {
        promptId: "brand-specific-001",
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
