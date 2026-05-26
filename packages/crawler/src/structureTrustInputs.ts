import type {
  CrawledPageSnapshot,
  SourceGapCandidate,
  SourceGapSeverity,
  SourceGapType,
  StructureTrustInputBundle
} from "@openvisi/core";

export interface StructureTrustInputBundleInput {
  crawledPages: CrawledPageSnapshot[];
  crawlerSummary?: unknown;
  generatedAt?: string;
  preferredSourceDomains?: string[];
}

export function createStructureTrustInputBundle(
  input: StructureTrustInputBundleInput
): StructureTrustInputBundle {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const pages = input.crawledPages;
  const pageCount = pages.length;
  const aiReadableStructureSignals = {
    pagesWithClearH1: countDiagnostic(pages, "hasClearH1"),
    pagesWithDocsLikeStructure: countDiagnostic(pages, "hasDocsLikeStructure"),
    pagesWithFAQSection: countDiagnostic(pages, "hasFAQSection"),
    pagesWithComparisonSignals: countDiagnostic(pages, "hasComparisonPageSignals"),
    averageContentDepthEstimate: averageContentDepthEstimate(pages)
  };
  const machineReadableTrustSignals = {
    pagesWithJsonLd: countDiagnostic(pages, "hasJsonLd"),
    pagesWithOrganizationSchema: countDiagnostic(pages, "hasOrganizationSchema"),
    pagesWithProductSchema: countDiagnostic(pages, "hasProductSchema"),
    pagesWithFAQSchema: countDiagnostic(pages, "hasFAQSchema"),
    pagesWithAuthorMetadata: countDiagnostic(pages, "hasAuthorMetadata"),
    pagesWithLastModifiedMetadata: countDiagnostic(pages, "hasLastModifiedMetadata"),
    pagesWithCanonical: countDiagnostic(pages, "canonicalPresent"),
    httpsPages: countDiagnostic(pages, "httpsEnabled")
  };

  return {
    schemaVersion: "0.1",
    generatedAt,
    sourceArtifacts: {
      crawledPages: "crawled-pages.json",
      crawlerSummary: "crawler-summary.json"
    },
    pageCount,
    aiReadableStructureSignals,
    machineReadableTrustSignals,
    aiCitationSignalInputs: {
      hasOfficialStructuredData:
        machineReadableTrustSignals.pagesWithOrganizationSchema > 0 ||
        machineReadableTrustSignals.pagesWithProductSchema > 0,
      hasDocumentationLikeSources: aiReadableStructureSignals.pagesWithDocsLikeStructure > 0,
      hasFAQLikeSources: aiReadableStructureSignals.pagesWithFAQSection > 0,
      hasComparisonLikeSources: aiReadableStructureSignals.pagesWithComparisonSignals > 0,
      preferredSourceDomains: collectPreferredSourceDomains(pages, input.preferredSourceDomains)
    },
    sourceGapCandidates: createSourceGapCandidates({
      pageCount,
      aiReadableStructureSignals,
      machineReadableTrustSignals
    }),
    limitations: [
      "Derived from static crawler output only.",
      "Does not include LLM-generated answers or citation behavior."
    ]
  };
}

function createSourceGapCandidates(input: {
  pageCount: number;
  aiReadableStructureSignals: StructureTrustInputBundle["aiReadableStructureSignals"];
  machineReadableTrustSignals: StructureTrustInputBundle["machineReadableTrustSignals"];
}): SourceGapCandidate[] {
  if (input.pageCount === 0) return [];

  const candidates: SourceGapCandidate[] = [];

  addGapIfMissing(candidates, {
    id: "missing-json-ld",
    type: "missing_json_ld",
    detectedCount: input.machineReadableTrustSignals.pagesWithJsonLd,
    pageCount: input.pageCount,
    description: "No JSON-LD detected on crawled pages.",
    severityWhenMissingEverywhere: "high"
  });
  addGapIfMissing(candidates, {
    id: "missing-organization-schema",
    type: "missing_organization_schema",
    detectedCount: input.machineReadableTrustSignals.pagesWithOrganizationSchema,
    pageCount: input.pageCount,
    description: "No Organization-like schema detected on crawled pages.",
    severityWhenMissingEverywhere: "high"
  });
  addGapIfMissing(candidates, {
    id: "missing-product-schema",
    type: "missing_product_schema",
    detectedCount: input.machineReadableTrustSignals.pagesWithProductSchema,
    pageCount: input.pageCount,
    description: "No Product, Service, or SoftwareApplication schema detected on crawled pages.",
    severityWhenMissingEverywhere: "medium"
  });
  addGapIfMissing(candidates, {
    id: "missing-faq-schema",
    type: "missing_faq_schema",
    detectedCount: input.machineReadableTrustSignals.pagesWithFAQSchema,
    pageCount: input.pageCount,
    description: "No FAQPage schema detected on crawled pages.",
    severityWhenMissingEverywhere: "low"
  });
  addGapIfMissing(candidates, {
    id: "missing-author-metadata",
    type: "missing_author_metadata",
    detectedCount: input.machineReadableTrustSignals.pagesWithAuthorMetadata,
    pageCount: input.pageCount,
    description: "No author metadata detected on crawled pages.",
    severityWhenMissingEverywhere: "low"
  });
  addGapIfMissing(candidates, {
    id: "missing-last-modified-metadata",
    type: "missing_last_modified_metadata",
    detectedCount: input.machineReadableTrustSignals.pagesWithLastModifiedMetadata,
    pageCount: input.pageCount,
    description: "No last-modified metadata detected on crawled pages.",
    severityWhenMissingEverywhere: "low"
  });
  addGapIfMissing(candidates, {
    id: "missing-canonical",
    type: "missing_canonical",
    detectedCount: input.machineReadableTrustSignals.pagesWithCanonical,
    pageCount: input.pageCount,
    description: "Canonical URL metadata is missing from crawled pages.",
    severityWhenMissingEverywhere: "high"
  });
  addGapIfMissing(candidates, {
    id: "unclear-h1-structure",
    type: "unclear_h1_structure",
    detectedCount: input.aiReadableStructureSignals.pagesWithClearH1,
    pageCount: input.pageCount,
    description: "Clear single-H1 structure is missing from crawled pages.",
    severityWhenMissingEverywhere: "medium"
  });
  addGapIfMissing(candidates, {
    id: "missing-docs-structure",
    type: "missing_docs_structure",
    detectedCount: input.aiReadableStructureSignals.pagesWithDocsLikeStructure,
    pageCount: input.pageCount,
    description: "Docs-like or guide-like source structure was not detected.",
    severityWhenMissingEverywhere: "medium"
  });
  addGapIfMissing(candidates, {
    id: "missing-faq-section",
    type: "missing_faq_section",
    detectedCount: input.aiReadableStructureSignals.pagesWithFAQSection,
    pageCount: input.pageCount,
    description: "FAQ-like source structure was not detected.",
    severityWhenMissingEverywhere: "low"
  });
  addGapIfMissing(candidates, {
    id: "missing-comparison-content",
    type: "missing_comparison_content",
    detectedCount: input.aiReadableStructureSignals.pagesWithComparisonSignals,
    pageCount: input.pageCount,
    description: "Comparison-like source structure was not detected.",
    severityWhenMissingEverywhere: "low"
  });

  if (input.aiReadableStructureSignals.averageContentDepthEstimate < 80) {
    candidates.push({
      id: "thin-content",
      type: "thin_content",
      severity: "medium",
      description: "Average crawled page content depth is low.",
      evidence: ["crawled-pages.json", "crawler-summary.json"]
    });
  }

  return candidates;
}

function addGapIfMissing(
  candidates: SourceGapCandidate[],
  input: {
    id: string;
    type: SourceGapType;
    detectedCount: number;
    pageCount: number;
    description: string;
    severityWhenMissingEverywhere: SourceGapSeverity;
  }
): void {
  if (input.detectedCount >= input.pageCount) return;

  candidates.push({
    id: input.id,
    type: input.type,
    severity: input.detectedCount === 0 ? input.severityWhenMissingEverywhere : "medium",
    description: input.description,
    evidence: ["crawled-pages.json", "crawler-summary.json"]
  });
}

function countDiagnostic(
  pages: CrawledPageSnapshot[],
  key: keyof NonNullable<CrawledPageSnapshot["diagnostics"]>
): number {
  return pages.filter((page) => page.diagnostics?.[key] === true).length;
}

function averageContentDepthEstimate(pages: CrawledPageSnapshot[]): number {
  const estimates = pages
    .map((page) => page.diagnostics?.contentDepthEstimate)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  if (estimates.length === 0) return 0;

  return Math.round(estimates.reduce((sum, value) => sum + value, 0) / estimates.length);
}

function collectPreferredSourceDomains(
  pages: CrawledPageSnapshot[],
  preferredSourceDomains: string[] | undefined
): string[] {
  const domains = new Set<string>();

  for (const domain of preferredSourceDomains ?? []) {
    if (domain.trim()) domains.add(domain.trim().replace(/^www\./, ""));
  }

  for (const page of pages) {
    try {
      domains.add(new URL(page.url).hostname.replace(/^www\./, ""));
    } catch {
      // Ignore malformed source URLs rather than inventing a source domain.
    }
  }

  return [...domains].sort();
}
