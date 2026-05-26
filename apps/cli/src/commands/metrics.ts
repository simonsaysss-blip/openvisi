import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Command } from "commander";
import {
  composeMetricsDraftFromMeasurementInputs,
  createMetricsFinalizationFromReview,
  createMetricsReviewFromDraft,
  validateMeasurementInputBundleShape,
  validateMetricsDraftBundleShape,
  validateMetricsFinalizationBundleShape,
  validateMetricsReviewBundleShape,
  type ArtifactBundleValidationResult,
  type MeasurementInputBundle,
  type MetricsDraftBundle,
  type MetricsReviewBundle
} from "@openvisi/core";
import { readArtifactBundle, resolveArtifactPath } from "../artifactReader.js";
import { artifactById, createArtifactManifest } from "../artifacts.js";
import { ensureOutputDir, removeKnownArtifactFiles, writeJsonFile } from "../output.js";

export interface MetricsDraftOptions {
  measurementOutput: string;
  output: string;
}

export interface MetricsDraftCommandResult {
  outputDir: string;
  evidenceMode: string;
  draftMetricCount: number;
  warnings: string[];
}

export interface MetricsReviewOptions {
  metricsDraftOutput: string;
  output: string;
}

export interface MetricsReviewCommandResult {
  outputDir: string;
  evidenceMode: string;
  readyForFinalMetrics: boolean;
  readyForAiVisibilityScore: boolean;
  warnings: string[];
}

export interface MetricsGuardOptions {
  metricsReviewOutput: string;
  output: string;
}

export interface MetricsGuardCommandResult {
  outputDir: string;
  status: string;
  allowedToGenerateMetricsJson: boolean;
  allowedToComputeAiVisibilityScore: boolean;
  warnings: string[];
}

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
  "report-references.json",
  "metrics.json",
  "metrics-draft.json",
  "metrics-review.json",
  "metrics-finalization.json",
  "citations.json",
  "scan-result.json",
  "report.md",
  "report.html"
];

export function registerMetricsCommand(program: Command): void {
  const metrics = program
    .command("metrics")
    .description("Compose explainable OpenVisi metrics artifacts.");

  metrics
    .command("draft")
    .description("Compose metrics-draft.json from measurement-inputs.json.")
    .option(
      "--measurement-output <directory>",
      "Measurement input artifact bundle directory",
      "openvisi-measurement"
    )
    .option("-o, --output <directory>", "Metrics draft artifact output directory", "openvisi-metrics-draft")
    .action(async (options: MetricsDraftOptions) => {
      try {
        const result = await runMetricsDraftCommand(options);
        console.log(`OpenVisi metrics draft artifacts written to: ${result.outputDir}`);
        console.log(`Evidence mode: ${result.evidenceMode}`);
        console.log(`Draft metrics: ${result.draftMetricCount}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown metrics draft error";
        console.error(`OpenVisi metrics draft failed: ${message}`);
        process.exitCode = 1;
      }
    });

  metrics
    .command("review")
    .description("Review metrics-draft.json readiness before final metrics composition.")
    .option(
      "--metrics-draft-output <directory>",
      "Metrics draft artifact bundle directory",
      "openvisi-metrics-draft"
    )
    .option("-o, --output <directory>", "Metrics review artifact output directory", "openvisi-metrics-review")
    .action(async (options: MetricsReviewOptions) => {
      try {
        const result = await runMetricsReviewCommand(options);
        console.log(`OpenVisi metrics review artifacts written to: ${result.outputDir}`);
        console.log(`Evidence mode: ${result.evidenceMode}`);
        console.log(`Ready for final metrics: ${result.readyForFinalMetrics}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown metrics review error";
        console.error(`OpenVisi metrics review failed: ${message}`);
        process.exitCode = 1;
      }
    });

  metrics
    .command("guard")
    .description("Create metrics-finalization.json from metrics-review.json.")
    .option(
      "--metrics-review-output <directory>",
      "Metrics review artifact bundle directory",
      "openvisi-metrics-review"
    )
    .option(
      "-o, --output <directory>",
      "Metrics finalization artifact output directory",
      "openvisi-metrics-finalization"
    )
    .action(async (options: MetricsGuardOptions) => {
      try {
        const result = await runMetricsGuardCommand(options);
        console.log(`OpenVisi metrics finalization artifacts written to: ${result.outputDir}`);
        console.log(`Status: ${result.status}`);
        console.log(`Allowed to generate metrics.json: ${result.allowedToGenerateMetricsJson}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown metrics guard error";
        console.error(`OpenVisi metrics guard failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runMetricsDraftCommand(
  options: MetricsDraftOptions
): Promise<MetricsDraftCommandResult> {
  const measurementOutput = path.resolve(process.cwd(), options.measurementOutput);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (outputDir === measurementOutput) {
    throw new Error("Metrics draft output must be separate from the measurement input bundle.");
  }

  const measurementBundle = await readArtifactBundle(measurementOutput, {
    expectedStage: "measurement-inputs"
  });
  assertValidBundle("measurement input", measurementBundle.validation);

  const measurementInputs = await readValidatedMeasurementInputs(
    resolveArtifactPath(measurementOutput, "measurement-inputs.json")
  );
  const generatedAt = new Date().toISOString();
  const metricsDraft = composeMetricsDraftFromMeasurementInputs({
    measurementInputs,
    generatedAt
  });
  const draftErrors = validateMetricsDraftBundleShape(metricsDraft);

  if (draftErrors.length > 0) {
    throw new Error(
      `Generated metrics draft artifact is invalid:\n${draftErrors
        .map((error) => `- ${error}`)
        .join("\n")}`
    );
  }

  const warnings = [
    "Final aiVisibilityScore is not computed in Stage 4A.",
    "narrativeAccuracy is unavailable in Stage 4A without real LLM evidence or human review."
  ];

  if (metricsDraft.evidenceMode === "mock") {
    warnings.unshift("Metrics draft uses mock evaluator signals and is not real LLM evidence.");
  }

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [
    "metrics-draft.json",
    "warnings.json",
    "artifact-manifest.json",
    ...forbiddenOutputFileNames
  ]);
  await writeJsonFile(path.join(outputDir, "metrics-draft.json"), metricsDraft);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "metrics-draft",
      artifacts: [
        generatedArtifact("metrics-draft"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return {
    outputDir,
    evidenceMode: metricsDraft.evidenceMode,
    draftMetricCount: Object.keys(metricsDraft.draftMetrics).length,
    warnings
  };
}

export async function runMetricsReviewCommand(
  options: MetricsReviewOptions
): Promise<MetricsReviewCommandResult> {
  const metricsDraftOutput = path.resolve(process.cwd(), options.metricsDraftOutput);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (outputDir === metricsDraftOutput) {
    throw new Error("Metrics review output must be separate from the metrics draft bundle.");
  }

  const metricsDraftBundle = await readArtifactBundle(metricsDraftOutput, {
    expectedStage: "metrics-draft"
  });
  assertValidBundle("metrics draft", metricsDraftBundle.validation);

  const metricsDraft = await readValidatedMetricsDraft(
    resolveArtifactPath(metricsDraftOutput, "metrics-draft.json")
  );
  const generatedAt = new Date().toISOString();
  const metricsReview = createMetricsReviewFromDraft({
    metricsDraft,
    generatedAt
  });
  const reviewErrors = validateMetricsReviewBundleShape(metricsReview);

  if (reviewErrors.length > 0) {
    throw new Error(
      `Generated metrics review artifact is invalid:\n${reviewErrors
        .map((error) => `- ${error}`)
        .join("\n")}`
    );
  }

  const warnings = [
    "Final aiVisibilityScore is not computed in Stage 4B.",
    "narrativeAccuracy requires real LLM evidence or human review."
  ];

  if (metricsReview.evidenceMode === "mock") {
    warnings.unshift("Metrics review blocked finalization because evaluator evidence is mock.");
  }

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [
    "metrics-review.json",
    "warnings.json",
    "artifact-manifest.json",
    ...forbiddenOutputFileNames
  ]);
  await writeJsonFile(path.join(outputDir, "metrics-review.json"), metricsReview);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "metrics-review",
      artifacts: [
        generatedArtifact("metrics-review"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return {
    outputDir,
    evidenceMode: metricsReview.evidenceMode,
    readyForFinalMetrics: metricsReview.readiness.readyForFinalMetrics,
    readyForAiVisibilityScore: metricsReview.readiness.readyForAiVisibilityScore,
    warnings
  };
}

export async function runMetricsGuardCommand(
  options: MetricsGuardOptions
): Promise<MetricsGuardCommandResult> {
  const metricsReviewOutput = path.resolve(process.cwd(), options.metricsReviewOutput);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (outputDir === metricsReviewOutput) {
    throw new Error("Metrics finalization output must be separate from the metrics review bundle.");
  }

  const metricsReviewBundle = await readArtifactBundle(metricsReviewOutput, {
    expectedStage: "metrics-review"
  });
  assertValidBundle("metrics review", metricsReviewBundle.validation);

  const metricsReview = await readValidatedMetricsReview(
    resolveArtifactPath(metricsReviewOutput, "metrics-review.json")
  );
  const generatedAt = new Date().toISOString();
  const metricsFinalization = createMetricsFinalizationFromReview({
    metricsReview,
    generatedAt
  });
  const finalizationErrors = validateMetricsFinalizationBundleShape(metricsFinalization);

  if (finalizationErrors.length > 0) {
    throw new Error(
      `Generated metrics finalization artifact is invalid:\n${finalizationErrors
        .map((error) => `- ${error}`)
        .join("\n")}`
    );
  }

  const warnings = finalizationWarnings(metricsFinalization);

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [
    "metrics-finalization.json",
    "warnings.json",
    "artifact-manifest.json",
    ...forbiddenOutputFileNames
  ]);
  await writeJsonFile(path.join(outputDir, "metrics-finalization.json"), metricsFinalization);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "metrics-finalization",
      artifacts: [
        generatedArtifact("metrics-finalization"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return {
    outputDir,
    status: metricsFinalization.status,
    allowedToGenerateMetricsJson:
      metricsFinalization.decision.allowedToGenerateMetricsJson,
    allowedToComputeAiVisibilityScore:
      metricsFinalization.decision.allowedToComputeAiVisibilityScore,
    warnings
  };
}

async function readValidatedMeasurementInputs(filePath: string): Promise<MeasurementInputBundle> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validateMeasurementInputBundleShape(parsed);

  if (errors.length > 0) {
    throw new Error(
      `Invalid measurement-inputs.json:\n${errors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  return parsed as MeasurementInputBundle;
}

async function readValidatedMetricsDraft(filePath: string): Promise<MetricsDraftBundle> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validateMetricsDraftBundleShape(parsed);

  if (errors.length > 0) {
    throw new Error(
      `Invalid metrics-draft.json:\n${errors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  return parsed as MetricsDraftBundle;
}

async function readValidatedMetricsReview(filePath: string): Promise<MetricsReviewBundle> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
  const errors = validateMetricsReviewBundleShape(parsed);

  if (errors.length > 0) {
    throw new Error(
      `Invalid metrics-review.json:\n${errors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  return parsed as MetricsReviewBundle;
}

function finalizationWarnings(input: {
  status: string;
  evidenceMode: string;
  decision: {
    allowedToComputeAiVisibilityScore: boolean;
  };
}): string[] {
  const warnings: string[] = [];

  if (input.status === "blocked") {
    warnings.push("Final metrics generation is blocked by the metrics review gate.");
  }
  if (input.evidenceMode === "mock") {
    warnings.push("Mock evaluator evidence cannot produce production-ready final metrics.");
  }
  if (!input.decision.allowedToComputeAiVisibilityScore) {
    warnings.push("Final aiVisibilityScore is not allowed by the finalization guard.");
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
