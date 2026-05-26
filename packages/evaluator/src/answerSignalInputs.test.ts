import { describe, expect, it } from "vitest";
import type { AnswersArtifact } from "@openvisi/core";
import { createAnswerSignalInputBundle } from "./answerSignalInputs.js";
import { scanConfig } from "./testFixtures.js";

describe("createAnswerSignalInputBundle", () => {
  it("returns deterministic output", () => {
    const input = {
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    };

    expect(createAnswerSignalInputBundle(input)).toEqual(createAnswerSignalInputBundle(input));
  });

  it("counts target brand mentions from answers", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.answerPresenceSignals).toMatchObject({
      targetBrandMentions: 2,
      answersWithTargetBrand: 2,
      answersWithoutTargetBrand: 1
    });
  });

  it("counts competitor mentions from answers", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.competitorDisplacementSignals.competitorMentionCounts).toEqual({
      "Example Competitor": 2
    });
    expect(bundle.competitorDisplacementSignals.answersMentioningCompetitors).toBe(2);
    expect(bundle.competitorDisplacementSignals.answersMentioningCompetitorsWithoutTargetBrand).toBe(1);
  });

  it("counts citations and target domain citations only from citations", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.citationCoverageSignals).toEqual({
      answersWithCitations: 2,
      answersWithTargetDomainCitation: 1,
      totalCitationCount: 3,
      targetDomainCitationCount: 1
    });
  });

  it("marks mock answers and preserves prompt order", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.narrativeAccuracySignals.answersMarkedAsMock).toBe(2);
    expect(bundle.narrativeAccuracySignals.requiresHumanReview).toBe(true);
    expect(bundle.promptResults.map((result) => result.promptId)).toEqual([
      "category-discovery-001",
      "brand-specific-001",
      "buyer-intent-001"
    ]);
  });

  it("does not include metrics or aiVisibilityScore", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: answersArtifact(),
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    }) as unknown as Record<string, unknown>;

    expect(bundle.metrics).toBeUndefined();
    expect(bundle.aiVisibilityScore).toBeUndefined();
  });

  it("handles empty answers conservatively", () => {
    const bundle = createAnswerSignalInputBundle({
      answersArtifact: { ...answersArtifact(), answers: [] },
      config: scanConfig(),
      generatedAt: "2026-01-01T00:00:00.000Z"
    });

    expect(bundle.answerCount).toBe(0);
    expect(bundle.answerPresenceSignals.answersWithTargetBrand).toBe(0);
    expect(bundle.promptResults).toEqual([]);
  });
});

function answersArtifact(): AnswersArtifact {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    source: {
      promptPack: "prompt-pack.json",
      config: "config.normalized.json"
    },
    provider: "mock",
    model: "mock-v0",
    answers: [
      {
        promptId: "category-discovery-001",
        provider: "mock",
        model: "mock-v0",
        answerText:
          "[mock output] OpenVisi is an AI Visibility diagnostics toolkit. Example Competitor is a comparison point.",
        citations: [
          {
            url: "https://openvisi.dev/docs",
            sourceDomain: "openvisi.dev"
          },
          {
            url: "https://example.com/reference",
            sourceDomain: "example.com"
          }
        ],
        raw: { mock: true },
        createdAt: "2026-01-01T00:00:00.000Z"
      },
      {
        promptId: "brand-specific-001",
        provider: "mock",
        model: "mock-v0",
        answerText: "[mock output] OpenVisi supports AI Visibility diagnostics for B2B SaaS teams.",
        citations: [],
        raw: { mock: true },
        createdAt: "2026-01-01T00:01:00.000Z"
      },
      {
        promptId: "buyer-intent-001",
        provider: "mock",
        model: "mock-v0",
        answerText: "[mock output] Example Competitor is mentioned without the target brand.",
        citations: [
          {
            url: "https://competitor.example/reference",
            sourceDomain: "competitor.example"
          }
        ],
        raw: { mock: false },
        createdAt: "2026-01-01T00:02:00.000Z"
      }
    ]
  };
}
