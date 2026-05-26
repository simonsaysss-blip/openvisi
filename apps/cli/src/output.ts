import { access, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CrawledPageSnapshot, CrawlRenderMode } from "@openvisi/core";

export interface CrawlerDiagnosticsSummary {
  pagesWithJsonLd: number;
  pagesWithOrganizationSchema: number;
  pagesWithProductSchema: number;
  pagesWithFAQSchema: number;
  pagesWithAuthorMetadata: number;
  pagesWithLastModifiedMetadata: number;
  pagesWithCanonical: number;
  httpsPages: number;
  pagesWithClearH1: number;
  pagesWithDocsLikeStructure: number;
  pagesWithFAQSection: number;
  pagesWithComparisonSignals: number;
}

export interface CrawlerSummary {
  domain: string;
  seedUrl: string;
  pageCount: number;
  renderMode: CrawlRenderMode;
  generatedAt: string;
  diagnosticsSummary: CrawlerDiagnosticsSummary;
}

export async function ensureOutputDir(outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function removeKnownArtifactFiles(
  outputDir: string,
  fileNames: string[]
): Promise<void> {
  await Promise.all(
    fileNames.map((fileName) => rm(path.join(outputDir, fileName), { force: true }))
  );
}

export async function writeCrawlerArtifacts(
  outputDir: string,
  snapshots: CrawledPageSnapshot[],
  summary: CrawlerSummary,
  warnings: string[]
): Promise<void> {
  await ensureOutputDir(outputDir);
  await writeJsonFile(path.join(outputDir, "crawled-pages.json"), snapshots);
  await writeJsonFile(path.join(outputDir, "crawler-summary.json"), summary);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
}

export function createCrawlerSummary(input: {
  domain: string;
  seedUrl: string;
  renderMode: CrawlRenderMode;
  generatedAt: string;
  snapshots: CrawledPageSnapshot[];
}): CrawlerSummary {
  return {
    domain: input.domain,
    seedUrl: input.seedUrl,
    pageCount: input.snapshots.length,
    renderMode: input.renderMode,
    generatedAt: input.generatedAt,
    diagnosticsSummary: summarizeCrawlerDiagnostics(input.snapshots)
  };
}

export function summarizeCrawlerDiagnostics(
  snapshots: CrawledPageSnapshot[]
): CrawlerDiagnosticsSummary {
  return {
    pagesWithJsonLd: countDiagnostics(snapshots, "hasJsonLd"),
    pagesWithOrganizationSchema: countDiagnostics(snapshots, "hasOrganizationSchema"),
    pagesWithProductSchema: countDiagnostics(snapshots, "hasProductSchema"),
    pagesWithFAQSchema: countDiagnostics(snapshots, "hasFAQSchema"),
    pagesWithAuthorMetadata: countDiagnostics(snapshots, "hasAuthorMetadata"),
    pagesWithLastModifiedMetadata: countDiagnostics(snapshots, "hasLastModifiedMetadata"),
    pagesWithCanonical: countDiagnostics(snapshots, "canonicalPresent"),
    httpsPages: countDiagnostics(snapshots, "httpsEnabled"),
    pagesWithClearH1: countDiagnostics(snapshots, "hasClearH1"),
    pagesWithDocsLikeStructure: countDiagnostics(snapshots, "hasDocsLikeStructure"),
    pagesWithFAQSection: countDiagnostics(snapshots, "hasFAQSection"),
    pagesWithComparisonSignals: countDiagnostics(snapshots, "hasComparisonPageSignals")
  };
}

function countDiagnostics(
  snapshots: CrawledPageSnapshot[],
  key: keyof NonNullable<CrawledPageSnapshot["diagnostics"]>
): number {
  return snapshots.filter((snapshot) => snapshot.diagnostics?.[key] === true).length;
}
