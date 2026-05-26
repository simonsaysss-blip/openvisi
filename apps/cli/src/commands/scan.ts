import path from "node:path";
import type { Command } from "commander";
import { createAudit, validateScanConfig } from "@openvisi/core";
import type { OpenVisiScanConfig, PromptIntent } from "@openvisi/core";
import { crawlSite, createStructureTrustInputBundle, toCrawledPageSnapshot } from "@openvisi/crawler";
import { writeReports } from "@openvisi/report";
import { artifactById, createArtifactManifest, createCrawlReportReferences } from "../artifacts.js";
import { loadOpenVisiConfig, materializeScanConfig } from "../config.js";
import {
  createCrawlerSummary,
  ensureOutputDir,
  removeKnownArtifactFiles,
  writeCrawlerArtifacts,
  writeJsonFile
} from "../output.js";

export interface ScanOptions {
  config: string;
  output?: string;
  provider?: string;
  includeExperimentalMetrics?: boolean;
  dryRun?: boolean;
  maxPages: number;
  delayMs: number;
  timeoutMs: number;
  robots: boolean;
}

export interface DryRunScanPlan {
  brandName: string;
  domain: string;
  category: string;
  providers: OpenVisiScanConfig["providers"];
  outputDir: string;
  includeExperimentalMetrics: boolean;
  promptCount: number;
  promptIntents: PromptIntent[];
  competitorCount: number;
  generatedAt: string;
  nextStage: string;
}

const dryRunWarnings = [
  "Dry-run mode does not crawl pages.",
  "Dry-run mode does not call LLM providers.",
  "Metrics are not computed in Stage 1C."
];

export function registerScanCommand(program: Command): void {
  program
    .command("scan")
    .description("Run an AI Visibility scan or produce a dry-run scan plan.")
    .argument("[url]", "Website URL to scan")
    .option("--config <path>", "OpenVisi config path", "openvisi.config.json")
    .option("-o, --output <directory>", "Report output directory")
    .option("--provider <provider>", "Provider name override for config-driven scans")
    .option("--include-experimental-metrics", "Include experimental metrics in config")
    .option("--dry-run", "Write a deterministic scan plan without crawling or provider calls")
    .option("-m, --max-pages <number>", "Maximum pages to crawl", parseInteger, readDefaultMaxPages())
    .option("--delay-ms <number>", "Delay between page fetches", parseInteger, 250)
    .option("--timeout-ms <number>", "Fetch timeout per request", parseInteger, 10000)
    .option("--no-robots", "Do not respect robots.txt")
    .action(async (url: string | undefined, options: ScanOptions) => {
      try {
        if (options.dryRun) {
          const result = await runDryRunScan(options);
          console.log(`OpenVisi dry-run scan plan written to: ${result.outputDir}`);
          console.log(`Prompts: ${result.plan.promptCount}`);
          console.log(`Providers: ${result.plan.providers.map((provider) => provider.provider).join(", ")}`);
          process.exitCode = 0;
          return;
        }

        if (!url) {
          console.error("OpenVisi scan failed: URL is required unless --dry-run is used.");
          process.exitCode = 1;
          return;
        }

        await runUrlScan(url, options);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown OpenVisi error";
        console.error(`OpenVisi scan failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runDryRunScan(options: Pick<
  ScanOptions,
  "config" | "output" | "provider" | "includeExperimentalMetrics"
>): Promise<{ outputDir: string; plan: DryRunScanPlan }> {
  const input = await loadOpenVisiConfig(options.config);
  const config = materializeScanConfig(input, {
    ...(options.output ? { outputDir: options.output } : {}),
    ...(options.provider ? { provider: options.provider } : {}),
    ...(options.includeExperimentalMetrics ? { includeExperimentalMetrics: true } : {})
  });
  const errors = validateScanConfig(config);

  if (errors.length > 0) {
    throw new Error(`Invalid OpenVisi scan config:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  const outputDir = path.resolve(process.cwd(), config.outputDir);
  const generatedAt = new Date().toISOString();
  const plan = createDryRunScanPlan(config, generatedAt);

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [
    "crawled-pages.json",
    "crawler-summary.json",
    "structure-trust-inputs.json",
    "report-references.json",
    "answer-signal-inputs.json",
    "metrics.json",
    "answers.json",
    "citations.json",
    "scan-result.json",
    "debug-report.md",
    "report.md",
    "report.html"
  ]);
  await writeJsonFile(path.join(outputDir, "scan-plan.json"), plan);
  await writeJsonFile(path.join(outputDir, "prompt-pack.json"), config.promptPack);
  await writeJsonFile(path.join(outputDir, "config.normalized.json"), config);
  await writeJsonFile(path.join(outputDir, "warnings.json"), dryRunWarnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "dry-run",
      artifacts: [
        generatedArtifact("scan-plan"),
        generatedArtifact("prompt-pack"),
        generatedArtifact("config.normalized"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings: dryRunWarnings
    })
  );

  return { outputDir, plan };
}

async function runUrlScan(url: string, options: ScanOptions): Promise<void> {
  const crawl = await crawlSite(url, {
    maxPages: options.maxPages,
    respectRobots: options.robots,
    delayMs: options.delayMs,
    timeoutMs: options.timeoutMs
  });
  const audit = createAudit(crawl);
  const reportPaths = await writeReports(audit, options.output ?? "reports");
  const snapshots = crawl.pages.map((page) =>
    toCrawledPageSnapshot(page, {
      defaultRenderMode: "static",
      fetchedAt: crawl.crawledAt,
      sourceUrl: page.url
    })
  );
  const generatedAt = new Date().toISOString();
  const summary = createCrawlerSummary({
    domain: crawl.domain,
    seedUrl: crawl.normalizedUrl,
    renderMode: "static",
    generatedAt,
    snapshots
  });
  await writeCrawlerArtifacts(
    reportPaths.directory,
    snapshots,
    summary,
    [
      "Crawler artifacts are static-only in Stage 2B.",
      "Diagnostics may be incomplete when source pages omit machine-readable metadata."
    ]
  );
  await writeJsonFile(
    path.join(reportPaths.directory, "structure-trust-inputs.json"),
    createStructureTrustInputBundle({
      crawledPages: snapshots,
      crawlerSummary: summary,
      generatedAt,
      preferredSourceDomains: [crawl.domain]
    })
  );
  await writeJsonFile(
    path.join(reportPaths.directory, "report-references.json"),
    createCrawlReportReferences({ generatedAt })
  );
  await writeJsonFile(
    path.join(reportPaths.directory, "artifact-manifest.json"),
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
      warnings: [
        "Crawler artifacts are static-only in Stage 2B.",
        "Diagnostics may be incomplete when source pages omit machine-readable metadata."
      ]
    })
  );

  printSummary(audit, reportPaths.markdown);
}

function createDryRunScanPlan(config: OpenVisiScanConfig, generatedAt: string): DryRunScanPlan {
  return {
    brandName: config.brandName,
    domain: config.domain,
    category: config.category,
    providers: config.providers,
    outputDir: config.outputDir,
    includeExperimentalMetrics: config.includeExperimentalMetrics,
    promptCount: config.promptPack.length,
    promptIntents: [...new Set(config.promptPack.map((prompt) => prompt.intent))],
    competitorCount: config.competitors.length,
    generatedAt,
    nextStage: "Implement crawler and evaluator to produce full OpenVisiScanResult."
  };
}

function printSummary(audit: ReturnType<typeof createAudit>, reportPath: string): void {
  console.log(`AI Visibility Score: ${audit.scores.aiVisibility}/100`);
  console.log(`Entity Clarity Score: ${audit.scores.entityClarity.score}/100`);
  console.log(
    `Technical Discoverability Score: ${audit.scores.technicalDiscoverability.score}/100`
  );
  console.log(`Structured Data Score: ${audit.scores.structuredData.score}/100`);
  console.log(`Content Chunkability Score: ${audit.scores.contentChunkability.score}/100`);
  console.log(`Citation Readiness Score: ${audit.scores.citationReadiness.score}/100`);
  console.log("");
  console.log("Canonical Metrics Snapshot:");
  console.log(JSON.stringify(audit.canonicalMetrics.metrics, null, 2));
  console.log("");
  console.log(
    `Canonical measurement mode: ${audit.canonicalMetrics.measurementMode} (answer-level fields may be null until provider-backed prompt packs are run)`
  );
  console.log("");
  console.log("Top 10 Diagnostic Signals:");
  for (const [index, issue] of audit.issues.entries()) {
    console.log(`${index + 1}. [${issue.severity}] ${issue.title}`);
  }
  console.log("");
  console.log("Top 10 Suggested Structural Improvements:");
  for (const [index, fix] of audit.recommendations.entries()) {
    console.log(`${index + 1}. [${fix.priority}] ${fix.description}`);
  }
  console.log("");
  console.log(`Report output path: ${reportPath}`);
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, received "${value}"`);
  }
  return parsed;
}

function readDefaultMaxPages(): number {
  const raw = process.env.OPENVISI_MAX_PAGES;
  if (!raw) return 30;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

function generatedArtifact(id: string) {
  return {
    ...artifactById(id),
    generated: true
  };
}
