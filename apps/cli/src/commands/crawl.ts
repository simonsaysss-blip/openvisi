import path from "node:path";
import type { Command } from "commander";
import type { CrawlResult, CrawledPageSnapshot, CrawlRenderMode } from "@openvisi/core";
import { crawlSite, createStructureTrustInputBundle, toCrawledPageSnapshot } from "@openvisi/crawler";
import { artifactById, createArtifactManifest, createCrawlReportReferences } from "../artifacts.js";
import { loadOpenVisiConfig, materializeScanConfig } from "../config.js";
import { removeKnownArtifactFiles, createCrawlerSummary, writeCrawlerArtifacts, writeJsonFile } from "../output.js";

export interface CrawlCommandOptions {
  config: string;
  output?: string;
  url?: string;
  maxPages: number;
  renderMode: string;
}

export type StaticCrawler = (
  url: string,
  options: { maxPages: number }
) => Promise<CrawlResult>;

export function registerCrawlCommand(program: Command): void {
  program
    .command("crawl")
    .description("Run the static crawler and persist canonical CrawledPageSnapshot artifacts.")
    .option("--config <path>", "OpenVisi config path", "openvisi.config.json")
    .option("-o, --output <directory>", "Crawler artifact output directory")
    .option("--url <url>", "Seed URL override")
    .option("--max-pages <number>", "Maximum pages to crawl", parseInteger, 30)
    .option("--render-mode <mode>", "Render mode: static or headless", "static")
    .action(async (options: CrawlCommandOptions) => {
      try {
        const result = await runCrawlCommand(options);
        console.log(`OpenVisi crawler artifacts written to: ${result.outputDir}`);
        console.log(`Pages crawled: ${result.snapshots.length}`);
        for (const warning of result.warnings) {
          console.warn(`Warning: ${warning}`);
        }
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown crawl error";
        console.error(`OpenVisi crawl failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runCrawlCommand(
  options: CrawlCommandOptions,
  crawler: StaticCrawler = crawlSite
): Promise<{
  outputDir: string;
  snapshots: CrawledPageSnapshot[];
  warnings: string[];
}> {
  const input = await loadOpenVisiConfig(options.config);
  const config = materializeScanConfig(input, {
    ...(options.output ? { outputDir: options.output } : {})
  });
  const warnings = createBaseCrawlerWarnings(options.renderMode);
  const renderMode: CrawlRenderMode = "static";
  const seedUrl = normalizeSeedUrl(options.url ?? config.domain);
  const crawl = await crawler(seedUrl, { maxPages: options.maxPages });
  const generatedAt = new Date().toISOString();
  const snapshots = crawl.pages.map((page) =>
    toCrawledPageSnapshot(page, {
      defaultRenderMode: renderMode,
      fetchedAt: crawl.crawledAt,
      sourceUrl: page.url
    })
  );

  if (snapshots.length === 0) {
    warnings.push("No pages were crawled.");
  }

  const outputDir = path.resolve(process.cwd(), config.outputDir);
  const summary = createCrawlerSummary({
    domain: crawl.domain,
    seedUrl,
    renderMode,
    generatedAt,
    snapshots
  });

  await removeKnownArtifactFiles(outputDir, [
    "scan-plan.json",
    "prompt-pack.json",
    "config.normalized.json",
    "structure-trust-inputs.json",
    "metrics.json",
    "answers.json",
    "citations.json",
    "scan-result.json",
    "debug-report.md",
    "report.md",
    "report.html",
    "answers.json",
    "answer-signal-inputs.json"
  ]);
  await writeCrawlerArtifacts(outputDir, snapshots, summary, warnings);
  await writeJsonFile(
    path.join(outputDir, "structure-trust-inputs.json"),
    createStructureTrustInputBundle({
      crawledPages: snapshots,
      crawlerSummary: summary,
      generatedAt,
      preferredSourceDomains: [crawl.domain]
    })
  );
  await writeJsonFile(
    path.join(outputDir, "report-references.json"),
    createCrawlReportReferences({ generatedAt })
  );
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "static-crawl",
      artifacts: [
        generatedArtifact("crawled-pages"),
        generatedArtifact("crawler-summary"),
        generatedArtifact("structure-trust-inputs"),
        generatedArtifact("warnings"),
        generatedArtifact("report-references"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return { outputDir, snapshots, warnings };
}

function createBaseCrawlerWarnings(renderMode: string): string[] {
  const warnings = [
    "Crawler artifacts are static-only in Stage 2B.",
    "Diagnostics may be incomplete when source pages omit machine-readable metadata."
  ];

  if (renderMode === "headless") {
    warnings.unshift("Headless render mode is not implemented in Stage 2B; using static crawl.");
  } else if (renderMode !== "static") {
    warnings.unshift(`Unsupported render mode "${renderMode}"; using static crawl.`);
  }

  return warnings;
}

function normalizeSeedUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received "${value}"`);
  }
  return parsed;
}

function generatedArtifact(id: string) {
  return {
    ...artifactById(id),
    generated: true
  };
}
