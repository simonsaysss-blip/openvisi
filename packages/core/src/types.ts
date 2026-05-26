export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export type ScoreCategory =
  | "entityClarity"
  | "technicalDiscoverability"
  | "structuredData"
  | "contentChunkability"
  | "citationReadiness"
  | "promptSimulation";

export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type AnalyzerMaturity = "stable" | "experimental" | "heuristic";

export interface PageData {
  url: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  canonical: string | null;
  openGraph: Record<string, string>;
  schemaJsonLd: JsonValue[];
  visibleText: string;
  imageCount: number;
  internalLinks: string[];
  externalLinks: string[];
  discoveredFrom: string;
  error: string | null;
}

export interface SiteAsset {
  url: string;
  statusCode: number | null;
  found: boolean;
  contentType: string | null;
  bodyPreview: string | null;
  error: string | null;
}

export interface CrawlResult {
  inputUrl: string;
  normalizedUrl: string;
  origin: string;
  domain: string;
  crawledAt: string;
  maxPages: number;
  respectRobots: boolean;
  assets: {
    robotsTxt: SiteAsset;
    sitemapXml: SiteAsset;
    llmsTxt: SiteAsset;
  };
  pages: PageData[];
  skippedUrls: Array<{
    url: string;
    reason: string;
  }>;
}

export interface ScoreDetail {
  score: number;
  weight: number;
  evidence: string[];
}

export interface VisibilityIssue {
  id: string;
  category: ScoreCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  evidence: string[];
}

export interface RecommendedFix {
  id: string;
  category: ScoreCategory;
  priority: IssueSeverity;
  title: string;
  description: string;
}

export interface PromptSimulationResult {
  questionId: string;
  prompt: string;
  provider: string;
  model: string;
  answer: string;
  consistency: "not-run" | "consistent" | "partial" | "inconsistent" | "error";
  evidence: string[];
  error: string | null;
}

export interface AnalyzerResult {
  score: number;
  maturity: AnalyzerMaturity;
  detectedSignals: string[];
  missingSignals: string[];
  interpretation: string;
  suggestedStructuralImprovements: string[];
  issues: VisibilityIssue[];
  recommendations: RecommendedFix[];
  evidence: string[];
  details?: Record<string, JsonValue>;
  promptResults?: PromptSimulationResult[];
}

export interface AuditResult {
  projectName: string;
  methodologyVersion: string;
  generatedAt: string;
  target: {
    inputUrl: string;
    normalizedUrl: string;
    domain: string;
  };
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
  issues: VisibilityIssue[];
  recommendations: RecommendedFix[];
  crawl: CrawlResult;
}
