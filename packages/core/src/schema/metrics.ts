export type OpenVisiMetricName =
  | "aiVisibilityScore"
  | "answerPresence"
  | "answerShare"
  | "promptCoverage"
  | "mentionRate"
  | "entityClarity"
  | "narrativeAccuracy"
  | "positioningAccuracy"
  | "productUnderstanding"
  | "citationCoverage"
  | "officialSourceCitationRate"
  | "thirdPartySourceReliance"
  | "aiCitationSignals"
  | "competitorDisplacement"
  | "categoryShare"
  | "alternativeRecommendationRate"
  | "comparisonVisibility"
  | "aiReadableStructure"
  | "machineReadableTrust"
  | "ragReadiness"
  | "ragRetrievalReadiness"
  | "contextualDefensibility"
  | "entityRelationalStrength";

export type OpenVisiMetricLayer =
  | "presence"
  | "accuracy"
  | "citation"
  | "competitive"
  | "trustStructure"
  | "composite"
  | "experimental";

export type OpenVisiMetricValue = number | null;
export type OpenVisiMetrics = Record<OpenVisiMetricName, OpenVisiMetricValue>;
export type CanonicalMetricStatus = "measured" | "diagnostic-proxy" | "not-measured";

export interface MetricDefinition {
  name: OpenVisiMetricName;
  label: string;
  layer: OpenVisiMetricLayer;
  scale: "0-1" | "0-100";
  description: string;
  experimental: boolean;
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

export const openVisiMetricNames = [
  "aiVisibilityScore",
  "answerPresence",
  "answerShare",
  "promptCoverage",
  "mentionRate",
  "entityClarity",
  "narrativeAccuracy",
  "positioningAccuracy",
  "productUnderstanding",
  "citationCoverage",
  "officialSourceCitationRate",
  "thirdPartySourceReliance",
  "aiCitationSignals",
  "competitorDisplacement",
  "categoryShare",
  "alternativeRecommendationRate",
  "comparisonVisibility",
  "aiReadableStructure",
  "machineReadableTrust",
  "ragReadiness",
  "ragRetrievalReadiness",
  "contextualDefensibility",
  "entityRelationalStrength"
] as const satisfies readonly OpenVisiMetricName[];

const metricNameSet = new Set<string>(openVisiMetricNames);

export const metricDefinitions: Record<OpenVisiMetricName, MetricDefinition> = {
  // Composite: the top-level OpenVisi summary score. It is derived only when enough
  // layer-level evidence exists for the v0.1 diagnostic helper.
  aiVisibilityScore: {
    name: "aiVisibilityScore",
    label: "AI Visibility Score",
    layer: "composite",
    scale: "0-100",
    experimental: false,
    description:
      "Composite diagnostic score for measurable AI Visibility signals across presence, accuracy, citation, competitive, and trust-structure layers."
  },

  // Presence: whether and how often the entity appears in AI-generated answers.
  answerPresence: {
    name: "answerPresence",
    label: "Answer Presence",
    layer: "presence",
    scale: "0-1",
    experimental: false,
    description:
      "Share of evaluated prompts where the target entity appears in the generated answer."
  },
  answerShare: {
    name: "answerShare",
    label: "Answer Share",
    layer: "presence",
    scale: "0-1",
    experimental: false,
    description:
      "The target entity's share of mentions, recommendation slots, or answer real estate across measured answers."
  },
  promptCoverage: {
    name: "promptCoverage",
    label: "Prompt Coverage",
    layer: "presence",
    scale: "0-1",
    experimental: false,
    description: "Share of the prompt pack that produced valid measurable answers for the scan."
  },
  mentionRate: {
    name: "mentionRate",
    label: "Mention Rate",
    layer: "presence",
    scale: "0-1",
    experimental: false,
    description:
      "Rate at which the entity is explicitly mentioned across collected AI-generated answers."
  },

  // Accuracy: whether generated or source-derived descriptions match the entity.
  entityClarity: {
    name: "entityClarity",
    label: "Entity Clarity",
    layer: "accuracy",
    scale: "0-1",
    experimental: false,
    description:
      "How clearly public source material defines the entity, category, audience, offering, and differentiation."
  },
  narrativeAccuracy: {
    name: "narrativeAccuracy",
    label: "Narrative Accuracy",
    layer: "accuracy",
    scale: "0-1",
    experimental: false,
    description:
      "Accuracy of generated descriptions of the entity, category, product, audience, and positioning when compared with source evidence."
  },
  positioningAccuracy: {
    name: "positioningAccuracy",
    label: "Positioning Accuracy",
    layer: "accuracy",
    scale: "0-1",
    experimental: false,
    description:
      "How accurately generated answers place the entity within its intended category, market, or use case."
  },
  productUnderstanding: {
    name: "productUnderstanding",
    label: "Product Understanding",
    layer: "accuracy",
    scale: "0-1",
    experimental: false,
    description:
      "How well generated answers understand the entity's products, services, capabilities, or target users."
  },

  // Citation: whether answers cite, rely on, or can trace claims to usable sources.
  citationCoverage: {
    name: "citationCoverage",
    label: "Citation Coverage",
    layer: "citation",
    scale: "0-1",
    experimental: false,
    description: "Share of measured answers that cite or rely on sources connected to the entity."
  },
  officialSourceCitationRate: {
    name: "officialSourceCitationRate",
    label: "Official Source Citation Rate",
    layer: "citation",
    scale: "0-1",
    experimental: false,
    description:
      "Rate at which measured answers cite official sources controlled by or directly associated with the entity."
  },
  thirdPartySourceReliance: {
    name: "thirdPartySourceReliance",
    label: "Third-party Source Reliance",
    layer: "citation",
    scale: "0-1",
    experimental: false,
    description:
      "Rate at which measured answers rely on third-party sources to describe or validate the entity."
  },
  aiCitationSignals: {
    name: "aiCitationSignals",
    label: "AI Citation Signals",
    layer: "citation",
    scale: "0-1",
    experimental: false,
    description:
      "Strength of public signals that make source pages easier to cite, verify, and reuse in generated answers."
  },

  // Competitive: whether the target is displaced by alternatives in relevant answers.
  competitorDisplacement: {
    name: "competitorDisplacement",
    label: "Competitor Displacement",
    layer: "competitive",
    scale: "0-1",
    experimental: false,
    description:
      "Rate at which measured answers recommend, cite, or describe competitors instead of the target entity."
  },
  categoryShare: {
    name: "categoryShare",
    label: "Category Share",
    layer: "competitive",
    scale: "0-1",
    experimental: false,
    description: "The target entity's share of mentions within category-level answer sets."
  },
  alternativeRecommendationRate: {
    name: "alternativeRecommendationRate",
    label: "Alternative Recommendation Rate",
    layer: "competitive",
    scale: "0-1",
    experimental: false,
    description:
      "Rate at which alternative entities are recommended for prompts where the target entity should be considered."
  },
  comparisonVisibility: {
    name: "comparisonVisibility",
    label: "Comparison Visibility",
    layer: "competitive",
    scale: "0-1",
    experimental: false,
    description:
      "How often and how clearly the target entity appears in comparison or alternative-selection answers."
  },

  // Trust / structure: machine-readable source structure that supports reliable interpretation.
  aiReadableStructure: {
    name: "aiReadableStructure",
    label: "AI-readable Structure",
    layer: "trustStructure",
    scale: "0-1",
    experimental: false,
    description:
      "Strength of crawlable, chunkable, structured public content that can be interpreted by AI systems."
  },
  machineReadableTrust: {
    name: "machineReadableTrust",
    label: "Machine-readable Trust",
    layer: "trustStructure",
    scale: "0-1",
    experimental: false,
    description:
      "Strength of parseable credibility, authority, source freshness, and official-source consistency signals."
  },

  // Experimental: early research metrics. These are explicitly not stable methodology claims.
  ragReadiness: {
    name: "ragReadiness",
    label: "RAG Readiness",
    layer: "experimental",
    scale: "0-1",
    experimental: true,
    description:
      "Experimental estimate of whether the entity's public content is suitable for retrieval-augmented generation workflows."
  },
  ragRetrievalReadiness: {
    name: "ragRetrievalReadiness",
    label: "RAG Retrieval Readiness",
    layer: "experimental",
    scale: "0-1",
    experimental: true,
    description:
      "Experimental estimate of whether source pages are segmented, titled, and structured for reliable retrieval."
  },
  contextualDefensibility: {
    name: "contextualDefensibility",
    label: "Contextual Defensibility",
    layer: "experimental",
    scale: "0-1",
    experimental: true,
    description:
      "Experimental estimate of whether claims can be defended with public context and supporting evidence."
  },
  entityRelationalStrength: {
    name: "entityRelationalStrength",
    label: "Entity Relational Strength",
    layer: "experimental",
    scale: "0-1",
    experimental: true,
    description:
      "Experimental estimate of how clearly the entity is connected to related people, products, locations, categories, and sources."
  }
};

export const metricLayerMap = {
  presence: ["answerPresence", "answerShare", "promptCoverage", "mentionRate"],
  accuracy: ["entityClarity", "narrativeAccuracy", "positioningAccuracy", "productUnderstanding"],
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
  ],
  trustStructure: ["aiReadableStructure", "machineReadableTrust"],
  composite: ["aiVisibilityScore"],
  experimental: [
    "ragReadiness",
    "ragRetrievalReadiness",
    "contextualDefensibility",
    "entityRelationalStrength"
  ]
} as const satisfies Record<OpenVisiMetricLayer, readonly OpenVisiMetricName[]>;

const v01LayerWeights = {
  presence: 0.25,
  accuracy: 0.25,
  citation: 0.2,
  competitive: 0.15,
  trustStructure: 0.15
} as const;

export function validateMetrics(metrics: Partial<OpenVisiMetrics>): string[] {
  const errors: string[] = [];

  for (const [name, value] of Object.entries(metrics)) {
    if (!isMetricName(name)) {
      errors.push(`Unknown OpenVisi metric: ${name}`);
      continue;
    }

    if (value === null || typeof value === "undefined") continue;

    if (typeof value !== "number" || !Number.isFinite(value)) {
      errors.push(`${name} must be a finite number or null.`);
      continue;
    }

    const definition = metricDefinitions[name];
    const min = 0;
    const max = definition.scale === "0-100" ? 100 : 1;

    if (value < min || value > max) {
      errors.push(`${name} must be between ${min} and ${max}.`);
    }
  }

  return errors;
}

export function computeAiVisibilityScoreV01(input: Partial<OpenVisiMetrics>): number | null {
  if (validateMetrics(input).length > 0) return null;

  const presence = averageAvailable([
    input.answerPresence,
    input.answerShare,
    input.promptCoverage,
    input.mentionRate
  ]);
  const accuracy = averageAvailable([
    input.entityClarity,
    input.narrativeAccuracy,
    input.positioningAccuracy,
    input.productUnderstanding
  ]);
  const citation = averageAvailable([
    input.citationCoverage,
    input.officialSourceCitationRate,
    input.aiCitationSignals
  ]);
  const competitive = averageAvailable([
    invertRate(input.competitorDisplacement),
    input.categoryShare,
    invertRate(input.alternativeRecommendationRate),
    input.comparisonVisibility
  ]);
  const trustStructure = averageAvailable([input.aiReadableStructure, input.machineReadableTrust]);

  if (
    presence === null ||
    accuracy === null ||
    citation === null ||
    competitive === null ||
    trustStructure === null
  ) {
    return null;
  }

  const weighted =
    presence * v01LayerWeights.presence +
    accuracy * v01LayerWeights.accuracy +
    citation * v01LayerWeights.citation +
    competitive * v01LayerWeights.competitive +
    trustStructure * v01LayerWeights.trustStructure;

  return roundScore(weighted * 100);
}

function isMetricName(name: string): name is OpenVisiMetricName {
  return metricNameSet.has(name);
}

function averageAvailable(values: Array<number | null | undefined>): number | null {
  const available = values.filter((value): value is number => typeof value === "number");
  if (available.length === 0) return null;
  return available.reduce((sum, value) => sum + value, 0) / available.length;
}

function invertRate(value: number | null | undefined): number | null | undefined {
  if (typeof value !== "number") return value;
  return 1 - value;
}

function roundScore(value: number): number {
  return Number(value.toFixed(2));
}
