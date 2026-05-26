import type { CrawledPageSnapshot } from "@openvisi/core";

export interface DiagnosticInput {
  url: string;
  textContent?: string;
  meta?: Record<string, string>;
  jsonLd?: unknown[];
  headings?: {
    h1?: string[];
    h2?: string[];
    h3?: string[];
  };
  links?: {
    internal?: string[];
    external?: string[];
  };
  canonical?: string | null;
}

export function extractMachineReadableTrustDiagnostics(
  input: DiagnosticInput
): CrawledPageSnapshot["diagnostics"] {
  const jsonLd = input.jsonLd ?? [];
  const schemaTypes = collectSchemaTypes(jsonLd);
  const meta = normalizeMeta(input.meta ?? {});

  return {
    hasJsonLd: jsonLd.length > 0,
    hasOrganizationSchema: hasAnySchemaType(schemaTypes, [
      "organization",
      "localbusiness",
      "educationalorganization",
      "school",
      "corporation"
    ]),
    hasProductSchema: hasAnySchemaType(schemaTypes, [
      "product",
      "softwareapplication",
      "webapplication",
      "service"
    ]),
    hasFAQSchema: hasAnySchemaType(schemaTypes, ["faqpage"]),
    hasAuthorMetadata: hasAnyMetaKey(meta, ["author", "article:author", "byline", "dc.creator"]),
    hasLastModifiedMetadata: hasAnyMetaKey(meta, [
      "last-modified",
      "last-modified-date",
      "article:modified_time",
      "datemodified",
      "og:updated_time",
      "modified",
      "updated"
    ]),
    canonicalPresent:
      Boolean(input.canonical && input.canonical.trim()) ||
      hasAnyMetaKey(meta, ["canonical", "canonicalurl", "link:canonical"]),
    httpsEnabled: input.url.startsWith("https://")
  };
}

export function extractAiReadableStructureDiagnostics(
  input: DiagnosticInput
): CrawledPageSnapshot["diagnostics"] {
  const headings = {
    h1: normalizeTextArray(input.headings?.h1 ?? []),
    h2: normalizeTextArray(input.headings?.h2 ?? []),
    h3: normalizeTextArray(input.headings?.h3 ?? [])
  };
  const textContent = input.textContent ?? "";
  const searchableText = [input.url, ...headings.h1, ...headings.h2, ...headings.h3, textContent]
    .join(" ")
    .toLowerCase();
  const internalLinks = input.links?.internal ?? [];

  return {
    hasClearH1: headings.h1.length === 1,
    hasDocsLikeStructure: /\b(docs?|documentation|guide|api|reference|developer|tutorial)\b/i.test(
      searchableText
    ),
    hasFAQSection: /\b(faq|frequently asked questions)\b/i.test(searchableText),
    hasComparisonPageSignals:
      /\b(alternatives?|comparison|compare|competitors?)\b/i.test(searchableText) ||
      /(?:^|[\s/-])vs(?:[\s/-]|$)/i.test(searchableText),
    ...(internalLinks.length >= 5 ? { hasStableNavigation: true } : {}),
    contentDepthEstimate: estimateContentDepth(textContent)
  };
}

function collectSchemaTypes(values: unknown[]): string[] {
  return values.flatMap((value) => collectSchemaTypesFromValue(value)).map((value) => value.toLowerCase());
}

function collectSchemaTypesFromValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectSchemaTypesFromValue(item));

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const ownTypes = normalizeSchemaType(record["@type"]);
    const graphTypes = collectSchemaTypesFromValue(record["@graph"]);
    const nestedTypes = Object.entries(record)
      .filter(([key]) => key !== "@type" && key !== "@graph")
      .flatMap(([, nestedValue]) => collectSchemaTypesFromValue(nestedValue));
    return [...ownTypes, ...graphTypes, ...nestedTypes];
  }

  return [];
}

function normalizeSchemaType(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function hasAnySchemaType(schemaTypes: string[], targets: string[]): boolean {
  return schemaTypes.some((schemaType) => targets.includes(schemaType.toLowerCase()));
}

function normalizeMeta(meta: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(meta).map(([key, value]) => [key.toLowerCase(), value]));
}

function hasAnyMetaKey(meta: Record<string, string>, keys: string[]): boolean {
  return keys.some((key) => {
    const normalizedKey = key.toLowerCase();
    return typeof meta[normalizedKey] === "string" && meta[normalizedKey].trim().length > 0;
  });
}

function normalizeTextArray(values: string[]): string[] {
  return values.map((value) => value.trim()).filter((value) => value.length > 0);
}

function estimateContentDepth(textContent: string): number {
  const words = textContent.trim().split(/\s+/).filter(Boolean);
  return words.length;
}
