export type OpenVisiMetricName =
  | "aiVisibilityScore"
  | "answerPresence"
  | "answerShare"
  | "entityClarity"
  | "citationCoverage"
  | "competitorDisplacement"
  | "machineReadableTrust"
  | "aiCitationSignals"
  | "narrativeAccuracy"
  | "officialSourceCitationRate"
  | "thirdPartySourceReliance"
  | "promptCoverage"
  | "categoryShare"
  | "alternativeRecommendationRate"
  | "comparisonVisibility";

export type OpenVisiMetricLayer = "presence" | "accuracy" | "citation" | "competitive";

export type OpenVisiMetricValue = number | null;
export type OpenVisiMetrics = Record<OpenVisiMetricName, OpenVisiMetricValue>;
export type CanonicalMetricStatus = "measured" | "diagnostic-proxy" | "not-measured";

export interface MetricDefinition {
  name: OpenVisiMetricName;
  label: string;
  layer: OpenVisiMetricLayer;
  scale: "0-1" | "0-100";
  description: string;
}

export interface CanonicalMetricDetail {
  value: OpenVisiMetricValue;
  status: CanonicalMetricStatus;
  layer: OpenVisiMetricLayer;
  scale: "0-1" | "0-100";
  evidence: string[];
  note: string;
}

export interface CanonicalMetricsSnapshot {
  methodologyVersion: string;
  measurementMode: "crawl-diagnostic-v0.1";
  definition: string;
  metrics: OpenVisiMetrics;
  details: Record<OpenVisiMetricName, CanonicalMetricDetail>;
  limitations: string[];
}

export const metricDefinitions: Record<OpenVisiMetricName, MetricDefinition> = {
  aiVisibilityScore: {
    name: "aiVisibilityScore",
    label: "AI Visibility Score",
    layer: "presence",
    scale: "0-100",
    description:
      "Transparent composite score for the measurable AI Visibility signals of an entity."
  },
  answerPresence: {
    name: "answerPresence",
    label: "Answer Presence",
    layer: "presence",
    scale: "0-1",
    description:
      "Rate at which the target entity appears in AI-generated answers for a prompt pack."
  },
  answerShare: {
    name: "answerShare",
    label: "Answer Share",
    layer: "presence",
    scale: "0-1",
    description:
      "The target entity's share of mentions or recommendation slots across relevant answers."
  },
  entityClarity: {
    name: "entityClarity",
    label: "Entity Clarity",
    layer: "accuracy",
    scale: "0-1",
    description:
      "How clearly public source material defines the entity, category, audience, offering, and differentiation."
  },
  citationCoverage: {
    name: "citationCoverage",
    label: "Citation Coverage",
    layer: "citation",
    scale: "0-1",
    description: "Share of answers that cite or rely on sources connected to the target entity."
  },
  competitorDisplacement: {
    name: "competitorDisplacement",
    label: "Competitor Displacement",
    layer: "competitive",
    scale: "0-1",
    description:
      "Rate at which AI answers recommend, cite, or describe competitors instead of the target entity."
  },
  machineReadableTrust: {
    name: "machineReadableTrust",
    label: "Machine-readable Trust",
    layer: "citation",
    scale: "0-1",
    description:
      "Strength of parseable credibility, authority, source freshness, and official-source consistency signals."
  },
  aiCitationSignals: {
    name: "aiCitationSignals",
    label: "AI Citation Signals",
    layer: "citation",
    scale: "0-1",
    description:
      "Strength of public signals that increase the likelihood of being cited in AI-generated answers."
  },
  narrativeAccuracy: {
    name: "narrativeAccuracy",
    label: "Narrative Accuracy",
    layer: "accuracy",
    scale: "0-1",
    description:
      "Accuracy of AI-generated descriptions of the entity, category, product, audience, and positioning."
  },
  officialSourceCitationRate: {
    name: "officialSourceCitationRate",
    label: "Official Source Citation Rate",
    layer: "citation",
    scale: "0-1",
    description:
      "Rate at which AI answers cite official sources controlled by or directly associated with the entity."
  },
  thirdPartySourceReliance: {
    name: "thirdPartySourceReliance",
    label: "Third-party Source Reliance",
    layer: "citation",
    scale: "0-1",
    description:
      "Rate at which AI answers rely on third-party sources to describe or validate the entity."
  },
  promptCoverage: {
    name: "promptCoverage",
    label: "Prompt Coverage",
    layer: "presence",
    scale: "0-1",
    description:
      "Share of a prompt pack that produced valid measurable answers for the visibility scan."
  },
  categoryShare: {
    name: "categoryShare",
    label: "Category Share",
    layer: "competitive",
    scale: "0-1",
    description: "The target entity's share of mentions within category-level answer sets."
  },
  alternativeRecommendationRate: {
    name: "alternativeRecommendationRate",
    label: "Alternative Recommendation Rate",
    layer: "competitive",
    scale: "0-1",
    description:
      "Rate at which alternatives are recommended for prompts where the target entity should be considered."
  },
  comparisonVisibility: {
    name: "comparisonVisibility",
    label: "Comparison Visibility",
    layer: "competitive",
    scale: "0-1",
    description:
      "Whether and how often the target entity appears in comparison or alternative-selection answers."
  }
};

export const metricLayerMap = {
  presence: ["answerPresence", "answerShare", "promptCoverage"],
  accuracy: ["entityClarity", "narrativeAccuracy"],
  citation: [
    "citationCoverage",
    "officialSourceCitationRate",
    "thirdPartySourceReliance",
    "aiCitationSignals"
  ],
  competitive: [
    "competitorDisplacement",
    "categoryShare",
    "alternativeRecommendationRate",
    "comparisonVisibility"
  ]
} as const satisfies Record<OpenVisiMetricLayer, readonly OpenVisiMetricName[]>;
