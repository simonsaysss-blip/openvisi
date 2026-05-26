import type { MeasurementInputBundle } from "./schema/measurementInputs.js";
import type {
  MetricsDraftBundle,
  MetricsDraftEvidenceMode,
  MetricsDraftValue
} from "./schema/metricsDraft.js";

export function composeMetricsDraftFromMeasurementInputs(input: {
  measurementInputs: MeasurementInputBundle;
  generatedAt?: string;
}): MetricsDraftBundle {
  const measurementInputs = input.measurementInputs;
  const answerSignals = measurementInputs.answerSignalInputs;
  const structureSignals = measurementInputs.structureTrustInputs;
  const answerCount = answerSignals.answerCount;
  const pageCount = structureSignals.pageCount;
  const evidenceMode = determineEvidenceMode(measurementInputs);
  const mockLimitations =
    evidenceMode === "mock" ? ["Mock evaluator output is not real LLM evidence."] : undefined;

  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    status: "draft",
    final: false,
    sourceArtifacts: {
      measurementInputs: "measurement-inputs.json"
    },
    evidenceMode,
    draftMetrics: {
      answerPresence: metric({
        value: ratio(answerSignals.answerPresenceSignals.answersWithTargetBrand, answerCount),
        available: answerCount > 0,
        derivedFrom: ["answer-signal-inputs"],
        explanation: "answersWithTargetBrand / answerCount",
        limitations: mockLimitations
      }),
      answerShare: metric({
        value: answerShareValue(measurementInputs),
        available: answerSignals.answerPresenceSignals.targetBrandMentions >= 0,
        derivedFrom: ["answer-signal-inputs"],
        explanation: "targetBrandMentions / max(targetBrandMentions + total competitor mentions, 1)",
        limitations: [
          "Competitor mention data is derived from answer-signal-inputs, not final market share.",
          ...(mockLimitations ?? [])
        ]
      }),
      entityClarity: metric({
        value: average(
          [
            answerSignals.entityClaritySignals.answersWithCategoryTerms,
            answerSignals.entityClaritySignals.answersWithDomainTerms,
            answerSignals.entityClaritySignals.answersWithAudienceTerms
          ].map((value) => ratio(value, answerCount))
        ),
        available: answerCount > 0,
        derivedFrom: ["answer-signal-inputs"],
        explanation:
          "average of answersWithCategoryTerms, answersWithDomainTerms, and answersWithAudienceTerms divided by answerCount",
        limitations: mockLimitations
      }),
      citationCoverage: metric({
        value: ratio(answerSignals.citationCoverageSignals.answersWithTargetDomainCitation, answerCount),
        available: answerCount > 0,
        derivedFrom: ["answer-signal-inputs"],
        explanation: "answersWithTargetDomainCitation / answerCount",
        limitations:
          answerSignals.citationCoverageSignals.totalCitationCount === 0
            ? ["No citations were observed in answer-signal-inputs.", ...(mockLimitations ?? [])]
            : mockLimitations
      }),
      competitorDisplacement: metric({
        value: ratio(
          answerSignals.competitorDisplacementSignals.answersMentioningCompetitorsWithoutTargetBrand,
          answerCount
        ),
        available: answerCount > 0,
        derivedFrom: ["answer-signal-inputs"],
        explanation: "answersMentioningCompetitorsWithoutTargetBrand / answerCount",
        limitations: mockLimitations
      }),
      aiReadableStructure: metric({
        value: average(
          [
            structureSignals.aiReadableStructureSignals.pagesWithClearH1,
            structureSignals.aiReadableStructureSignals.pagesWithDocsLikeStructure,
            structureSignals.aiReadableStructureSignals.pagesWithFAQSection,
            structureSignals.aiReadableStructureSignals.pagesWithComparisonSignals
          ].map((value) => ratio(value, pageCount))
        ),
        available: pageCount > 0,
        derivedFrom: ["structure-trust-inputs"],
        explanation:
          "average of clear H1, docs-like structure, FAQ section, and comparison signal page counts divided by pageCount"
      }),
      machineReadableTrust: metric({
        value: average(
          [
            structureSignals.machineReadableTrustSignals.pagesWithJsonLd,
            structureSignals.machineReadableTrustSignals.pagesWithOrganizationSchema,
            structureSignals.machineReadableTrustSignals.pagesWithProductSchema,
            structureSignals.machineReadableTrustSignals.pagesWithFAQSchema,
            structureSignals.machineReadableTrustSignals.pagesWithAuthorMetadata,
            structureSignals.machineReadableTrustSignals.pagesWithLastModifiedMetadata,
            structureSignals.machineReadableTrustSignals.pagesWithCanonical,
            structureSignals.machineReadableTrustSignals.httpsPages
          ].map((value) => ratio(value, pageCount))
        ),
        available: pageCount > 0,
        derivedFrom: ["structure-trust-inputs"],
        explanation:
          "average of JSON-LD, schema, metadata, canonical, and HTTPS signal counts divided by pageCount"
      }),
      aiCitationSignals: metric({
        value: average(
          [
            structureSignals.aiCitationSignalInputs.hasOfficialStructuredData,
            structureSignals.aiCitationSignalInputs.hasDocumentationLikeSources,
            structureSignals.aiCitationSignalInputs.hasFAQLikeSources,
            structureSignals.aiCitationSignalInputs.hasComparisonLikeSources
          ].map((value) => (value ? 1 : 0))
        ),
        available: true,
        derivedFrom: ["structure-trust-inputs"],
        explanation:
          "average of official structured data, documentation-like sources, FAQ-like sources, and comparison-like sources booleans"
      }),
      narrativeAccuracy: metric({
        value: evidenceMode === "mock" ? null : null,
        available: false,
        derivedFrom: ["answer-signal-inputs"],
        explanation: "narrativeAccuracy requires real LLM output or human review.",
        limitations: ["Not available in Stage 4A with mock evaluator evidence."]
      })
    },
    excludedMetrics: [
      {
        name: "aiVisibilityScore",
        reason: "Final AI Visibility Score is not computed in Stage 4A."
      }
    ],
    completeness: {
      hasMeasurementInputs: true,
      hasStructureTrustInputs: measurementInputs.inputCompleteness.hasStructureTrustInputs,
      hasAnswerSignalInputs: measurementInputs.inputCompleteness.hasAnswerSignalInputs,
      hasMockEvaluatorSignals: evidenceMode === "mock",
      readyForFinalMetrics: false
    },
    limitations: [
      "Draft metrics are transparent intermediate values.",
      "This artifact is not metrics.json.",
      "This artifact does not include final aiVisibilityScore.",
      ...(evidenceMode === "mock" ? ["Mock evaluator signals are not real LLM evidence."] : [])
    ]
  };
}

function determineEvidenceMode(input: MeasurementInputBundle): MetricsDraftEvidenceMode {
  if (
    input.answerSignalInputs.provider === "mock" ||
    input.evidenceSummary.provider === "mock"
  ) {
    return "mock";
  }

  return "unknown";
}

function answerShareValue(input: MeasurementInputBundle): number {
  const targetMentions = input.answerSignalInputs.answerPresenceSignals.targetBrandMentions;
  const competitorMentions = Object.values(
    input.answerSignalInputs.competitorDisplacementSignals.competitorMentionCounts
  ).reduce((sum, value) => sum + value, 0);

  return targetMentions / Math.max(targetMentions + competitorMentions, 1);
}

function metric(
  input: Omit<MetricsDraftValue, "limitations"> & { limitations?: string[] | undefined }
): MetricsDraftValue {
  const output: MetricsDraftValue = {
    value: input.available ? input.value : null,
    available: input.available,
    derivedFrom: input.derivedFrom,
    explanation: input.explanation
  };

  if (input.limitations && input.limitations.length > 0) {
    output.limitations = input.limitations;
  }

  return output;
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return clamp01(numerator / denominator);
}

function average(values: Array<number | null>): number | null {
  const availableValues = values.filter((value): value is number => value !== null);
  if (availableValues.length === 0) return null;
  return clamp01(availableValues.reduce((sum, value) => sum + value, 0) / availableValues.length);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
