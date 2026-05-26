import type { OpenVisiMetrics } from "./metrics.js";

export type PromptIntent =
  | "category_discovery"
  | "alternative_comparison"
  | "problem_solution"
  | "brand_specific"
  | "integration"
  | "buyer_intent";

export interface CompetitorSpec {
  name: string;
  domain?: string;
  aliases?: string[];
}

export interface PromptSpec {
  id: string;
  text: string;
  intent: PromptIntent;
  category: string;
  expectedEntities?: string[];
  targetEntity?: string;
  metadata?: Record<string, unknown>;
}

export interface ScanProviderConfig {
  provider: string;
  model?: string;
  enabled: boolean;
}

export interface OpenVisiScanConfig {
  brandName: string;
  domain: string;
  category: string;
  competitors: CompetitorSpec[];
  promptPack: PromptSpec[];
  providers: ScanProviderConfig[];
  outputDir: string;
  includeExperimentalMetrics: boolean;
}

export interface Citation {
  url: string;
  title?: string;
  sourceDomain?: string;
  confidence?: number;
}

export interface LLMAnswer {
  promptId: string;
  provider: string;
  model: string;
  answerText: string;
  citations: Citation[];
  raw?: unknown;
  createdAt: string;
}

export type CrawlRenderMode = "static" | "headless";

export interface CrawledPageSnapshot {
  url: string;
  title?: string;
  textContent: string;
  meta: Record<string, string>;
  jsonLd: unknown[];
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: string[];
    external: string[];
  };
  fetchedAt: string;
  renderMode: CrawlRenderMode;
  diagnostics?: {
    hasJsonLd?: boolean;
    hasOrganizationSchema?: boolean;
    hasProductSchema?: boolean;
    hasFAQSchema?: boolean;
    hasAuthorMetadata?: boolean;
    hasLastModifiedMetadata?: boolean;
    canonicalPresent?: boolean;
    httpsEnabled?: boolean;
    hasClearH1?: boolean;
    hasDocsLikeStructure?: boolean;
    hasFAQSection?: boolean;
    hasComparisonPageSignals?: boolean;
    hasStableNavigation?: boolean;
    contentDepthEstimate?: number;
  };
}

export interface OpenVisiScanResult {
  config: OpenVisiScanConfig;
  metrics: OpenVisiMetrics;
  answers: LLMAnswer[];
  crawledPages: CrawledPageSnapshot[];
  generatedAt: string;
  warnings?: string[];
}

export function validateScanConfig(config: Partial<OpenVisiScanConfig>): string[] {
  const errors: string[] = [];

  validateRequiredString(config.brandName, "brandName", errors);
  validateRequiredString(config.domain, "domain", errors);
  validateRequiredString(config.category, "category", errors);

  if (typeof config.domain === "string" && config.domain.trim()) {
    validateDomainLike(config.domain, errors);
  }

  if (!Array.isArray(config.promptPack) || config.promptPack.length === 0) {
    errors.push("promptPack must include at least one prompt.");
  } else {
    validatePromptPack(config.promptPack, errors);
  }

  if (!Array.isArray(config.providers) || config.providers.length === 0) {
    errors.push("providers must include at least one provider config.");
  } else {
    validateProviders(config.providers, errors);
  }

  if (typeof config.outputDir !== "undefined") {
    validateRequiredString(config.outputDir, "outputDir", errors);
  }

  if (typeof config.competitors !== "undefined" && !Array.isArray(config.competitors)) {
    errors.push("competitors must be an array.");
  }

  return errors;
}

function validateRequiredString(value: unknown, fieldName: string, errors: string[]): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${fieldName} is required.`);
  }
}

function validateDomainLike(domain: string, errors: string[]): void {
  const normalized = domain.trim();
  if (/\s/.test(normalized)) {
    errors.push("domain must not contain whitespace.");
  }
  if (!normalized.includes(".")) {
    errors.push("domain must include a registrable domain or hostname.");
  }
}

function validatePromptPack(promptPack: PromptSpec[], errors: string[]): void {
  const seenPromptIds = new Set<string>();

  for (const [index, prompt] of promptPack.entries()) {
    const prefix = `promptPack[${index}]`;
    validateRequiredString(prompt.id, `${prefix}.id`, errors);
    validateRequiredString(prompt.text, `${prefix}.text`, errors);
    validateRequiredString(prompt.intent, `${prefix}.intent`, errors);
    validateRequiredString(prompt.category, `${prefix}.category`, errors);

    if (typeof prompt.id === "string" && prompt.id.trim()) {
      if (seenPromptIds.has(prompt.id)) {
        errors.push(`Duplicate prompt id: ${prompt.id}`);
      }
      seenPromptIds.add(prompt.id);
    }
  }
}

function validateProviders(providers: ScanProviderConfig[], errors: string[]): void {
  let enabledProviderCount = 0;

  for (const [index, provider] of providers.entries()) {
    validateRequiredString(provider.provider, `providers[${index}].provider`, errors);
    if (provider.enabled) enabledProviderCount += 1;
  }

  if (enabledProviderCount === 0) {
    errors.push("providers must include at least one enabled provider.");
  }
}
