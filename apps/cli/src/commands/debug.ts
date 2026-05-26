import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Command } from "commander";
import {
  validateAnswerSignalInputBundleShape,
  validateMeasurementInputBundleShape,
  validateMetricsDraftBundleShape,
  validateMetricsFinalizationBundleShape,
  validateMetricsReviewBundleShape,
  validateStructureTrustInputBundleShape,
  type AnswerSignalInputBundle,
  type ArtifactBundleStage,
  type ArtifactBundleValidationResult,
  type MeasurementInputBundle,
  type MetricsDraftBundle,
  type MetricsFinalizationBundle,
  type MetricsReviewBundle,
  type OpenVisiArtifactManifest,
  type StructureTrustInputBundle
} from "@openvisi/core";
import { readArtifactBundle, resolveArtifactPath } from "../artifactReader.js";
import { artifactById, createArtifactManifest } from "../artifacts.js";
import { ensureOutputDir, removeKnownArtifactFiles } from "../output.js";

export interface DebugReportOptions {
  dryRunOutput: string;
  crawlOutput: string;
  evalOutput: string;
  measurementOutput: string;
  metricsDraftOutput: string;
  metricsReviewOutput: string;
  metricsFinalizationOutput: string;
  output: string;
}

export interface DebugReportCommandResult {
  outputDir: string;
  reportPath: string;
  warnings: string[];
  sourceStages: ArtifactBundleStage[];
}

interface ScanPlanSummary {
  brandName: string;
  domain: string;
  category: string;
  providers: Array<{ provider: string; model?: string; enabled?: boolean }>;
  outputDir: string;
  promptCount: number;
}

interface CrawlerSummaryArtifact {
  pageCount: number;
  renderMode: string;
  diagnosticsSummary: {
    pagesWithJsonLd: number;
    pagesWithOrganizationSchema: number;
    pagesWithProductSchema: number;
    pagesWithFAQSchema: number;
    pagesWithCanonical: number;
    pagesWithClearH1: number;
    pagesWithDocsLikeStructure: number;
    pagesWithFAQSection: number;
    pagesWithComparisonSignals: number;
  };
}

interface SourceBundleSummary {
  label: string;
  outputDir: string;
  manifest: OpenVisiArtifactManifest;
  validation: ArtifactBundleValidationResult;
}

const outputFileNames = ["debug-report.md", "artifact-manifest.json", "warnings.json"];

const forbiddenOutputFileNames = [
  "scan-plan.json",
  "prompt-pack.json",
  "config.normalized.json",
  "crawled-pages.json",
  "crawler-summary.json",
  "structure-trust-inputs.json",
  "answers.json",
  "answer-signal-inputs.json",
  "measurement-inputs.json",
  "metrics-draft.json",
  "metrics-review.json",
  "metrics-finalization.json",
  "report-references.json",
  "metrics.json",
  "citations.json",
  "scan-result.json",
  "report.md",
  "report.html"
];

export function registerDebugCommand(program: Command): void {
  const debug = program.command("debug").description("Create OpenVisi debug artifacts.");

  debug
    .command("report")
    .description("Create debug-report.md from existing artifact bundles.")
    .option("--dry-run-output <directory>", "Dry-run artifact bundle directory", "openvisi-report")
    .option("--crawl-output <directory>", "Static crawl artifact bundle directory", "openvisi-crawl")
    .option("--eval-output <directory>", "Evaluation artifact bundle directory", "openvisi-eval")
    .option(
      "--measurement-output <directory>",
      "Measurement input artifact bundle directory",
      "openvisi-measurement"
    )
    .option(
      "--metrics-draft-output <directory>",
      "Metrics draft artifact bundle directory",
      "openvisi-metrics-draft"
    )
    .option(
      "--metrics-review-output <directory>",
      "Metrics review artifact bundle directory",
      "openvisi-metrics-review"
    )
    .option(
      "--metrics-finalization-output <directory>",
      "Metrics finalization artifact bundle directory",
      "openvisi-metrics-finalization"
    )
    .option("-o, --output <directory>", "Debug report artifact output directory", "openvisi-debug-report")
    .action(async (options: DebugReportOptions) => {
      try {
        const result = await runDebugReportCommand(options);
        console.log(`OpenVisi debug report artifacts written to: ${result.outputDir}`);
        console.log(`Report: ${result.reportPath}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown debug report error";
        console.error(`OpenVisi debug report failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runDebugReportCommand(
  options: DebugReportOptions
): Promise<DebugReportCommandResult> {
  const sourceDirectories = resolveSourceDirectories(options);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (sourceDirectories.some((source) => source.outputDir === outputDir)) {
    throw new Error("Debug report output must be separate from source artifact bundles.");
  }

  const dryRun = await readSourceBundle("dry-run", sourceDirectories[0]!, "dry-run");
  const staticCrawl = await readSourceBundle("static-crawl", sourceDirectories[1]!, "static-crawl");
  const evaluation = await readSourceBundle("evaluation", sourceDirectories[2]!, "evaluation");
  const measurement = await readSourceBundle(
    "measurement-inputs",
    sourceDirectories[3]!,
    "measurement-inputs"
  );
  const metricsDraft = await readSourceBundle(
    "metrics-draft",
    sourceDirectories[4]!,
    "metrics-draft"
  );
  const metricsReview = await readSourceBundle(
    "metrics-review",
    sourceDirectories[5]!,
    "metrics-review"
  );
  const metricsFinalization = await readSourceBundle(
    "metrics-finalization",
    sourceDirectories[6]!,
    "metrics-finalization"
  );

  const scanPlan = await readScanPlan(resolveArtifactPath(dryRun.outputDir, "scan-plan.json"));
  const crawlerSummary = await readCrawlerSummary(
    resolveArtifactPath(staticCrawl.outputDir, "crawler-summary.json")
  );
  const structureTrustInputs = await readValidatedJson<StructureTrustInputBundle>(
    resolveArtifactPath(staticCrawl.outputDir, "structure-trust-inputs.json"),
    validateStructureTrustInputBundleShape,
    "structure-trust-inputs.json"
  );
  const answerSignalInputs = await readValidatedJson<AnswerSignalInputBundle>(
    resolveArtifactPath(evaluation.outputDir, "answer-signal-inputs.json"),
    validateAnswerSignalInputBundleShape,
    "answer-signal-inputs.json"
  );
  const measurementInputs = await readValidatedJson<MeasurementInputBundle>(
    resolveArtifactPath(measurement.outputDir, "measurement-inputs.json"),
    validateMeasurementInputBundleShape,
    "measurement-inputs.json"
  );
  const metricsDraftArtifact = await readValidatedJson<MetricsDraftBundle>(
    resolveArtifactPath(metricsDraft.outputDir, "metrics-draft.json"),
    validateMetricsDraftBundleShape,
    "metrics-draft.json"
  );
  const metricsReviewArtifact = await readValidatedJson<MetricsReviewBundle>(
    resolveArtifactPath(metricsReview.outputDir, "metrics-review.json"),
    validateMetricsReviewBundleShape,
    "metrics-review.json"
  );
  const metricsFinalizationArtifact = await readValidatedJson<MetricsFinalizationBundle>(
    resolveArtifactPath(metricsFinalization.outputDir, "metrics-finalization.json"),
    validateMetricsFinalizationBundleShape,
    "metrics-finalization.json"
  );

  const sources = [
    dryRun,
    staticCrawl,
    evaluation,
    measurement,
    metricsDraft,
    metricsReview,
    metricsFinalization
  ];
  const warnings = createWarnings(metricsDraftArtifact, metricsFinalizationArtifact);
  const generatedAt = new Date().toISOString();
  const report = createDebugReportMarkdown({
    sources,
    scanPlan,
    crawlerSummary,
    structureTrustInputs,
    answerSignalInputs,
    measurementInputs,
    metricsDraft: metricsDraftArtifact,
    metricsReview: metricsReviewArtifact,
    metricsFinalization: metricsFinalizationArtifact
  });

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [...outputFileNames, ...forbiddenOutputFileNames]);
  await writeFile(path.join(outputDir, "debug-report.md"), report, "utf8");
  await writeFile(path.join(outputDir, "warnings.json"), `${JSON.stringify(warnings, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(outputDir, "artifact-manifest.json"),
    `${JSON.stringify(
      createArtifactManifest({
        generatedAt,
        stage: "debug-report",
        artifacts: [
          generatedArtifact("debug-report"),
          generatedArtifact("warnings"),
          generatedArtifact("artifact-manifest")
        ],
        warnings
      }),
      null,
      2
    )}\n`,
    "utf8"
  );

  return {
    outputDir,
    reportPath: path.join(outputDir, "debug-report.md"),
    warnings,
    sourceStages: sources.map((source) => source.manifest.stage)
  };
}

function createDebugReportMarkdown(input: {
  sources: SourceBundleSummary[];
  scanPlan: ScanPlanSummary;
  crawlerSummary: CrawlerSummaryArtifact;
  structureTrustInputs: StructureTrustInputBundle;
  answerSignalInputs: AnswerSignalInputBundle;
  measurementInputs: MeasurementInputBundle;
  metricsDraft: MetricsDraftBundle;
  metricsReview: MetricsReviewBundle;
  metricsFinalization: MetricsFinalizationBundle;
}): string {
  const blockedMetrics = Object.entries(input.metricsReview.metricReviews)
    .filter(([, review]) => review.decision === "blocked")
    .map(([metricName]) => metricName);
  const reviewRequiredMetrics = Object.entries(input.metricsReview.metricReviews)
    .filter(([, review]) => review.decision === "review_required")
    .map(([metricName]) => metricName);

  return [
    "# OpenVisi Artifact Debug Report",
    "",
    "## Status",
    "",
    "- This is an artifact debug report.",
    "- This is not a final AI Visibility report.",
    "- No final AI Visibility Score is computed.",
    ...(input.metricsDraft.evidenceMode === "mock"
      ? ["- Mock evaluator evidence is not real LLM evidence."]
      : []),
    ...(input.metricsFinalization.status === "blocked"
      ? ["- Final metrics generation is blocked by the finalization guard."]
      : []),
    "",
    "## Artifact Chain",
    "",
    "| Stage | Source Output Directory | Validation | Artifact Count |",
    "| --- | --- | --- | ---: |",
    ...input.sources.map(
      (source) =>
        `| ${source.manifest.stage} | ${source.outputDir} | ${
          source.validation.valid ? "passed" : "failed"
        } | ${source.manifest.artifacts.length} |`
    ),
    "",
    "## Dry-run Planning",
    "",
    `- brandName: ${input.scanPlan.brandName}`,
    `- domain: ${input.scanPlan.domain}`,
    `- category: ${input.scanPlan.category}`,
    `- promptCount: ${input.scanPlan.promptCount}`,
    `- providers: ${input.scanPlan.providers.map((provider) => provider.provider).join(", ")}`,
    `- outputDir: ${input.scanPlan.outputDir}`,
    "",
    "## Static Crawl Evidence",
    "",
    "- This is static crawler evidence only.",
    `- pageCount: ${input.crawlerSummary.pageCount}`,
    `- renderMode: ${input.crawlerSummary.renderMode}`,
    `- pagesWithJsonLd: ${input.crawlerSummary.diagnosticsSummary.pagesWithJsonLd}`,
    `- pagesWithOrganizationSchema: ${input.crawlerSummary.diagnosticsSummary.pagesWithOrganizationSchema}`,
    `- pagesWithProductSchema: ${input.crawlerSummary.diagnosticsSummary.pagesWithProductSchema}`,
    `- pagesWithFAQSchema: ${input.crawlerSummary.diagnosticsSummary.pagesWithFAQSchema}`,
    `- pagesWithCanonical: ${input.crawlerSummary.diagnosticsSummary.pagesWithCanonical}`,
    `- pagesWithClearH1: ${input.crawlerSummary.diagnosticsSummary.pagesWithClearH1}`,
    `- pagesWithDocsLikeStructure: ${input.crawlerSummary.diagnosticsSummary.pagesWithDocsLikeStructure}`,
    `- pagesWithFAQSection: ${input.crawlerSummary.diagnosticsSummary.pagesWithFAQSection}`,
    `- pagesWithComparisonSignals: ${input.crawlerSummary.diagnosticsSummary.pagesWithComparisonSignals}`,
    "",
    "## Evaluation Evidence",
    "",
    "- Mock answers are not real LLM evidence.",
    `- provider: ${input.answerSignalInputs.provider}`,
    `- model: ${input.answerSignalInputs.model}`,
    `- answerCount: ${input.answerSignalInputs.answerCount}`,
    `- answersMarkedAsMock: ${input.answerSignalInputs.narrativeAccuracySignals.answersMarkedAsMock}`,
    `- targetBrandMentions: ${input.answerSignalInputs.answerPresenceSignals.targetBrandMentions}`,
    `- answersWithTargetBrand: ${input.answerSignalInputs.answerPresenceSignals.answersWithTargetBrand}`,
    `- answersWithoutTargetBrand: ${input.answerSignalInputs.answerPresenceSignals.answersWithoutTargetBrand}`,
    `- answersWithCitations: ${input.answerSignalInputs.citationCoverageSignals.answersWithCitations}`,
    `- totalCitationCount: ${input.answerSignalInputs.citationCoverageSignals.totalCitationCount}`,
    `- targetDomainCitationCount: ${input.answerSignalInputs.citationCoverageSignals.targetDomainCitationCount}`,
    `- answersMentioningCompetitors: ${input.answerSignalInputs.competitorDisplacementSignals.answersMentioningCompetitors}`,
    `- answersMentioningCompetitorsWithoutTargetBrand: ${input.answerSignalInputs.competitorDisplacementSignals.answersMentioningCompetitorsWithoutTargetBrand}`,
    "",
    "## Measurement Inputs",
    "",
    "- This is input readiness, not final scoring.",
    `- hasStructureTrustInputs: ${input.measurementInputs.inputCompleteness.hasStructureTrustInputs}`,
    `- hasAnswerSignalInputs: ${input.measurementInputs.inputCompleteness.hasAnswerSignalInputs}`,
    `- hasCrawlerEvidence: ${input.measurementInputs.inputCompleteness.hasCrawlerEvidence}`,
    `- hasEvaluatorEvidence: ${input.measurementInputs.inputCompleteness.hasEvaluatorEvidence}`,
    `- readyForMetricsComposition: ${input.measurementInputs.inputCompleteness.readyForMetricsComposition}`,
    "",
    "## Metrics Draft",
    "",
    "- These are draft metrics only.",
    "",
    "| Metric | Value | Available | Derived From | Explanation |",
    "| --- | ---: | --- | --- | --- |",
    ...Object.entries(input.metricsDraft.draftMetrics).map(
      ([metricName, metric]) =>
        `| ${metricName} | ${formatMetricValue(metric.value)} | ${metric.available} | ${metric.derivedFrom.join(", ")} | ${escapeTableText(metric.explanation)} |`
    ),
    "",
    "## Metrics Review",
    "",
    `- readyForFinalMetrics: ${input.metricsReview.readiness.readyForFinalMetrics}`,
    `- readyForAiVisibilityScore: ${input.metricsReview.readiness.readyForAiVisibilityScore}`,
    `- productionReady: ${input.metricsReview.readiness.productionReady}`,
    `- blockedMetrics: ${blockedMetrics.length > 0 ? blockedMetrics.join(", ") : "none"}`,
    `- reviewRequiredMetrics: ${
      reviewRequiredMetrics.length > 0 ? reviewRequiredMetrics.join(", ") : "none"
    }`,
    `- blockingReasons: ${input.metricsReview.blockingReasons
      .map((reason) => reason.code)
      .join(", ")}`,
    "",
    "Recommended next actions:",
    ...input.metricsReview.recommendedNextActions.map((action) => `- ${action}`),
    "",
    "## Finalization Guard",
    "",
    `- status: ${input.metricsFinalization.status}`,
    `- allowedToGenerateMetricsJson: ${input.metricsFinalization.decision.allowedToGenerateMetricsJson}`,
    `- allowedToComputeAiVisibilityScore: ${input.metricsFinalization.decision.allowedToComputeAiVisibilityScore}`,
    `- allowedToGenerateScanResult: ${input.metricsFinalization.decision.allowedToGenerateScanResult}`,
    `- blockingReasons: ${input.metricsFinalization.blockingReasons
      .map((reason) => reason.code)
      .join(", ")}`,
    "",
    "Required before finalization:",
    ...input.metricsFinalization.requiredBeforeFinalization.map((action) => `- ${action}`),
    "",
    "## Why No AI Visibility Score Yet",
    "",
    "- The current pipeline uses mock evaluator evidence.",
    "- narrativeAccuracy is not final.",
    "- Final metrics are blocked by the review and finalization guard.",
    "- Final aiVisibilityScore is intentionally excluded.",
    "- Real provider evidence and review gates are required before final scoring.",
    "",
    "## Next Steps",
    "",
    "- Add real provider adapters behind explicit env-gated execution.",
    "- Add human or real-LLM narrative accuracy review.",
    "- Rerun metrics review and finalization guard.",
    "- Only then consider final metrics.json.",
    ""
  ].join("\n");
}

function resolveSourceDirectories(options: DebugReportOptions): Array<{
  label: string;
  outputDir: string;
}> {
  return [
    { label: "dry-run", outputDir: path.resolve(process.cwd(), options.dryRunOutput) },
    { label: "static-crawl", outputDir: path.resolve(process.cwd(), options.crawlOutput) },
    { label: "evaluation", outputDir: path.resolve(process.cwd(), options.evalOutput) },
    {
      label: "measurement-inputs",
      outputDir: path.resolve(process.cwd(), options.measurementOutput)
    },
    {
      label: "metrics-draft",
      outputDir: path.resolve(process.cwd(), options.metricsDraftOutput)
    },
    {
      label: "metrics-review",
      outputDir: path.resolve(process.cwd(), options.metricsReviewOutput)
    },
    {
      label: "metrics-finalization",
      outputDir: path.resolve(process.cwd(), options.metricsFinalizationOutput)
    }
  ];
}

async function readSourceBundle(
  label: string,
  source: { outputDir: string },
  expectedStage: ArtifactBundleStage
): Promise<SourceBundleSummary> {
  const bundle = await readArtifactBundle(source.outputDir, { expectedStage });
  assertValidBundle(label, bundle.validation);

  return {
    label,
    outputDir: source.outputDir,
    manifest: bundle.manifest,
    validation: bundle.validation
  };
}

async function readScanPlan(filePath: string): Promise<ScanPlanSummary> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("Invalid scan-plan.json: expected an object.");
  }

  return {
    brandName: String(parsed.brandName ?? ""),
    domain: String(parsed.domain ?? ""),
    category: String(parsed.category ?? ""),
    providers: Array.isArray(parsed.providers)
      ? parsed.providers.filter(isRecord).map((provider) => ({
          provider: String(provider.provider ?? ""),
          ...(typeof provider.model === "string" ? { model: provider.model } : {}),
          ...(typeof provider.enabled === "boolean" ? { enabled: provider.enabled } : {})
        }))
      : [],
    outputDir: String(parsed.outputDir ?? ""),
    promptCount: typeof parsed.promptCount === "number" ? parsed.promptCount : 0
  };
}

async function readCrawlerSummary(filePath: string): Promise<CrawlerSummaryArtifact> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  if (!isRecord(parsed) || !isRecord(parsed.diagnosticsSummary)) {
    throw new Error("Invalid crawler-summary.json: expected diagnosticsSummary object.");
  }

  return {
    pageCount: numberValue(parsed.pageCount),
    renderMode: String(parsed.renderMode ?? ""),
    diagnosticsSummary: {
      pagesWithJsonLd: numberValue(parsed.diagnosticsSummary.pagesWithJsonLd),
      pagesWithOrganizationSchema: numberValue(parsed.diagnosticsSummary.pagesWithOrganizationSchema),
      pagesWithProductSchema: numberValue(parsed.diagnosticsSummary.pagesWithProductSchema),
      pagesWithFAQSchema: numberValue(parsed.diagnosticsSummary.pagesWithFAQSchema),
      pagesWithCanonical: numberValue(parsed.diagnosticsSummary.pagesWithCanonical),
      pagesWithClearH1: numberValue(parsed.diagnosticsSummary.pagesWithClearH1),
      pagesWithDocsLikeStructure: numberValue(parsed.diagnosticsSummary.pagesWithDocsLikeStructure),
      pagesWithFAQSection: numberValue(parsed.diagnosticsSummary.pagesWithFAQSection),
      pagesWithComparisonSignals: numberValue(parsed.diagnosticsSummary.pagesWithComparisonSignals)
    }
  };
}

async function readValidatedJson<T>(
  filePath: string,
  validate: (input: unknown) => string[],
  artifactName: string
): Promise<T> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validate(parsed);

  if (errors.length > 0) {
    throw new Error(`Invalid ${artifactName}:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }

  return parsed as T;
}

function createWarnings(
  metricsDraft: MetricsDraftBundle,
  metricsFinalization: MetricsFinalizationBundle
): string[] {
  const warnings = [
    "debug-report.md is an artifact debug report, not a final AI Visibility report.",
    "No final AI Visibility Score is computed in Stage 5A."
  ];

  if (metricsDraft.evidenceMode === "mock") {
    warnings.push("Mock evaluator evidence is not real LLM evidence.");
  }
  if (metricsFinalization.status === "blocked") {
    warnings.push("Final metrics generation is blocked under current evidence.");
  }

  return warnings;
}

function assertValidBundle(label: string, validation: ArtifactBundleValidationResult): void {
  if (!validation.valid) {
    throw new Error(
      `Invalid ${label} artifact bundle:\n${validation.issues
        .map((issue) => `- ${issue.message}`)
        .join("\n")}`
    );
  }
}

function generatedArtifact(id: string) {
  return {
    ...artifactById(id),
    generated: true
  };
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatMetricValue(value: number | null): string {
  return value === null ? "null" : Number(value.toFixed(4)).toString();
}

function escapeTableText(value: string): string {
  return value.replaceAll("|", "\\|");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
