import type { CrawledPageSnapshot, CrawlRenderMode } from "@openvisi/core";
import {
  type DiagnosticInput,
  extractAiReadableStructureDiagnostics,
  extractMachineReadableTrustDiagnostics
} from "./diagnostics.js";
import { extractHtmlSnapshotFields } from "./extractors.js";

export interface SnapshotAdapterInput {
  url: string;
  title?: string | null;
  html?: string;
  textContent?: string;
  visibleText?: string;
  meta?: Record<string, string>;
  metaDescription?: string | null;
  openGraph?: Record<string, string>;
  canonical?: string | null;
  jsonLd?: unknown[];
  schemaJsonLd?: unknown[];
  headings?: {
    h1?: string[];
    h2?: string[];
    h3?: string[];
  };
  h1?: string[];
  h2?: string[];
  h3?: string[];
  links?: {
    internal?: string[];
    external?: string[];
  };
  internalLinks?: string[];
  externalLinks?: string[];
  fetchedAt?: string;
  renderMode?: CrawlRenderMode;
}

export interface SnapshotAdapterOptions {
  defaultRenderMode?: CrawlRenderMode;
  fetchedAt?: string;
  sourceUrl?: string;
}

export function toCrawledPageSnapshot(
  input: SnapshotAdapterInput,
  options: SnapshotAdapterOptions = {}
): CrawledPageSnapshot {
  const htmlFields = input.html
    ? extractHtmlSnapshotFields(input.html, options.sourceUrl ?? input.url)
    : null;
  const meta = normalizeMeta({
    ...(htmlFields?.meta ?? {}),
    ...(input.meta ?? {}),
    ...(input.openGraph ?? {}),
    ...(input.metaDescription ? { description: input.metaDescription } : {}),
    ...(input.canonical ? { canonical: input.canonical } : {})
  });
  const jsonLd = normalizeUnknownArray(input.jsonLd ?? input.schemaJsonLd ?? htmlFields?.jsonLd ?? []);
  const headings = {
    h1: uniqueText([...(htmlFields?.headings.h1 ?? []), ...(input.headings?.h1 ?? []), ...(input.h1 ?? [])]),
    h2: uniqueText([...(htmlFields?.headings.h2 ?? []), ...(input.headings?.h2 ?? []), ...(input.h2 ?? [])]),
    h3: uniqueText([...(htmlFields?.headings.h3 ?? []), ...(input.headings?.h3 ?? []), ...(input.h3 ?? [])])
  };
  const links = {
    internal: uniqueLinks([
      ...(htmlFields?.links.internal ?? []),
      ...(input.links?.internal ?? []),
      ...(input.internalLinks ?? [])
    ]),
    external: uniqueLinks([
      ...(htmlFields?.links.external ?? []),
      ...(input.links?.external ?? []),
      ...(input.externalLinks ?? [])
    ])
  };
  const textContent = normalizeWhitespace(
    input.textContent ?? input.visibleText ?? htmlFields?.textContent ?? ""
  );
  const fetchedAt = input.fetchedAt ?? options.fetchedAt ?? new Date().toISOString();
  const renderMode = input.renderMode ?? options.defaultRenderMode ?? "static";
  const diagnosticInput: DiagnosticInput = {
    url: input.url,
    textContent,
    meta,
    jsonLd,
    headings,
    links,
    ...(input.canonical ? { canonical: input.canonical } : {})
  };
  const diagnostics = {
    ...extractMachineReadableTrustDiagnostics(diagnosticInput),
    ...extractAiReadableStructureDiagnostics(diagnosticInput)
  };
  const title = normalizeOptionalString(input.title ?? htmlFields?.title);

  return {
    url: input.url,
    ...(title ? { title } : {}),
    textContent,
    meta,
    jsonLd,
    headings,
    links,
    fetchedAt,
    renderMode,
    diagnostics
  };
}

function normalizeMeta(meta: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(meta)
      .map(([key, value]) => [normalizeWhitespace(key), normalizeWhitespace(value)] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0)
  );
}

function normalizeUnknownArray(values: unknown[]): unknown[] {
  return Array.isArray(values) ? values : [];
}

function uniqueText(values: string[]): string[] {
  return unique(values.map(normalizeWhitespace).filter(Boolean));
}

function uniqueLinks(values: string[]): string[] {
  return unique(values.map((value) => value.trim()).filter(Boolean));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeWhitespace(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
