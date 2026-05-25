#!/usr/bin/env node
import { Command } from "commander";
import { createAudit } from "@openvisi/core";
import { crawlSite } from "@openvisi/crawler";
import { writeReports } from "@openvisi/report";

const program = new Command();

program
  .name("openvisi")
  .description("Open-source AI visibility analytics for the LLM search era.")
  .version("0.1.0");

program
  .command("scan")
  .description("Run an AI visibility audit for a website URL.")
  .argument("<url>", "Website URL to scan")
  .option("-m, --max-pages <number>", "Maximum pages to crawl", parseInteger, readDefaultMaxPages())
  .option("-o, --output <directory>", "Report output directory", "reports")
  .option("--delay-ms <number>", "Delay between page fetches", parseInteger, 250)
  .option("--timeout-ms <number>", "Fetch timeout per request", parseInteger, 10000)
  .option("--no-robots", "Do not respect robots.txt")
  .action(async (url: string, options: ScanOptions) => {
    try {
      const crawl = await crawlSite(url, {
        maxPages: options.maxPages,
        respectRobots: options.robots,
        delayMs: options.delayMs,
        timeoutMs: options.timeoutMs
      });
      const audit = createAudit(crawl);
      const reportPaths = await writeReports(audit, options.output);

      printSummary(audit, reportPaths.markdown);
      process.exitCode = 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown OpenVisi error";
      console.error(`OpenVisi scan failed: ${message}`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv);

interface ScanOptions {
  maxPages: number;
  output: string;
  delayMs: number;
  timeoutMs: number;
  robots: boolean;
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
  console.log("Top 10 Issues:");
  for (const [index, issue] of audit.issues.entries()) {
    console.log(`${index + 1}. [${issue.severity}] ${issue.title}`);
  }
  console.log("");
  console.log("Top 10 Recommended Fixes:");
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
