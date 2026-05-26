import type { AnalyzerResult, ScoreDetail } from "./types.js";
import {
  type CanonicalMetricDetail,
  type CanonicalMetricsSnapshot,
  type OpenVisiMetricName,
  metricDefinitions
} from "./schema/metrics.js";

interface CanonicalMetricsSource {
  methodologyVersion: string;
  scores: {
    aiVisibility: number;
    entityClarity: ScoreDetail;
    technicalDiscoverability: ScoreDetail;
    structuredData: ScoreDetail;
    contentChunkability: ScoreDetail;
    citationReadiness: ScoreDetail;
    promptSimulation: ScoreDetail;
  };
  analyzers: {
    entity: AnalyzerResult;
    technical: AnalyzerResult;
    structuredData: AnalyzerResult;
    content: AnalyzerResult;
    citationReadiness: AnalyzerResult;
    promptSimulation: AnalyzerResult;
  };
}

const canonicalDefinition =
  "AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers.";

export function createCanonicalMetricsSnapshot(
  source: CanonicalMetricsSource
): CanonicalMetricsSnapshot {
  const entity = normalizeScore(source.scores.entityClarity.score);
  const technical = normalizeScore(source.scores.technicalDiscoverability.score);
  const structuredData = normalizeScore(source.scores.structuredData.score);
  const content = normalizeScore(source.scores.contentChunkability.score);
  const citation = normalizeScore(source.scores.citationReadiness.score);

  const details: Record<OpenVisiMetricName, CanonicalMetricDetail> = {
    aiVisibilityScore: detail(
      "aiVisibilityScore",
      source.scores.aiVisibility,
      "measured",
      source.scores.entityClarity.evidence,
      "Composite crawl-diagnostic score from the current OpenVisi analyzer categories."
    ),
    answerPresence: detail(
      "answerPresence",
      average([entity, technical, content]),
      "diagnostic-proxy",
      source.scores.entityClarity.evidence,
      "Proxy based on crawlable identity, discoverability, and content structure. The MVP does not run live AI answer scans."
    ),
    answerShare: detail(
      "answerShare",
      null,
      "not-measured",
      [],
      "Requires provider-backed answer collection across a prompt pack."
    ),
    entityClarity: detail(
      "entityClarity",
      entity,
      "measured",
      source.scores.entityClarity.evidence,
      "Mapped from the current Entity Clarity analyzer."
    ),
    citationCoverage: detail(
      "citationCoverage",
      citation,
      "diagnostic-proxy",
      source.scores.citationReadiness.evidence,
      "Proxy based on citation-readiness evidence. The MVP does not inspect live answer citations."
    ),
    competitorDisplacement: detail(
      "competitorDisplacement",
      null,
      "not-measured",
      [],
      "Requires competitor-aware answer collection across category and comparison prompt packs."
    ),
    machineReadableTrust: detail(
      "machineReadableTrust",
      average([structuredData, citation]),
      "diagnostic-proxy",
      [...source.scores.structuredData.evidence, ...source.scores.citationReadiness.evidence],
      "Proxy based on structured data and citation-readiness evidence."
    ),
    aiCitationSignals: detail(
      "aiCitationSignals",
      average([technical, structuredData, citation]),
      "diagnostic-proxy",
      [
        ...source.scores.technicalDiscoverability.evidence,
        ...source.scores.structuredData.evidence,
        ...source.scores.citationReadiness.evidence
      ],
      "Proxy based on discoverability, structured data, and citation-readiness evidence."
    ),
    narrativeAccuracy: detail(
      "narrativeAccuracy",
      entity,
      "diagnostic-proxy",
      source.scores.entityClarity.evidence,
      "Proxy based on source clarity. Live narrative accuracy requires comparing generated answers to source evidence."
    ),
    officialSourceCitationRate: detail(
      "officialSourceCitationRate",
      null,
      "not-measured",
      [],
      "Requires live answer citations and source classification."
    ),
    thirdPartySourceReliance: detail(
      "thirdPartySourceReliance",
      null,
      "not-measured",
      [],
      "Requires live answer citations and source classification."
    ),
    promptCoverage: detail(
      "promptCoverage",
      null,
      "not-measured",
      [],
      "Requires a documented prompt pack and provider-backed answer collection."
    ),
    categoryShare: detail(
      "categoryShare",
      null,
      "not-measured",
      [],
      "Requires category-level prompt packs and competitor-aware answer collection."
    ),
    alternativeRecommendationRate: detail(
      "alternativeRecommendationRate",
      null,
      "not-measured",
      [],
      "Requires alternative and comparison prompt packs."
    ),
    comparisonVisibility: detail(
      "comparisonVisibility",
      null,
      "not-measured",
      [],
      "Requires comparison prompt packs and provider-backed answer collection."
    )
  };

  return {
    methodologyVersion: source.methodologyVersion,
    measurementMode: "crawl-diagnostic-v0.1",
    definition: canonicalDefinition,
    metrics: Object.fromEntries(
      Object.entries(details).map(([name, metricDetail]) => [name, metricDetail.value])
    ) as CanonicalMetricsSnapshot["metrics"],
    details,
    limitations: [
      "The current MVP uses crawl-based diagnostics and does not run live provider-backed AI answer scans by default.",
      "Answer-level fields marked not-measured require prompt packs and provider-backed answer collection.",
      "Diagnostic-proxy fields are directional and should not be interpreted as proprietary AI ranking, citation, or recommendation predictions."
    ]
  };
}

function detail(
  name: OpenVisiMetricName,
  value: number | null,
  status: CanonicalMetricDetail["status"],
  evidence: string[],
  note: string
): CanonicalMetricDetail {
  const definition = metricDefinitions[name];
  return {
    value,
    status,
    layer: definition.layer,
    scale: definition.scale,
    evidence: evidence.slice(0, 6),
    note
  };
}

function normalizeScore(score: number): number {
  return roundMetric(Math.max(0, Math.min(100, score)) / 100);
}

function average(values: number[]): number {
  return roundMetric(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}
