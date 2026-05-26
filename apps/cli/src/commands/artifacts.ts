import type { Command } from "commander";
import type { ArtifactBundleStage, ArtifactBundleValidationResult } from "@openvisi/core";
import { readArtifactBundle } from "../artifactReader.js";

export interface ArtifactsInspectOptions {
  output: string;
  stage?: string;
}

export interface ArtifactsInspectResult {
  outputDir: string;
  stage: ArtifactBundleStage;
  artifactCount: number;
  missingArtifacts: string[];
  warnings: string[];
  validation: ArtifactBundleValidationResult;
}

export function registerArtifactsCommand(program: Command): void {
  const artifacts = program.command("artifacts").description("Inspect OpenVisi artifact bundles.");

  artifacts
    .command("inspect")
    .description("Validate artifact-manifest.json and referenced bundle files.")
    .option("-o, --output <directory>", "OpenVisi artifact output directory", "openvisi-report")
    .option(
      "--stage <stage>",
      "Expected stage: dry-run, static-crawl, evaluation, measurement-inputs, metrics-draft, metrics-review, metrics-finalization, full-scan, report, or unknown"
    )
    .action(async (options: ArtifactsInspectOptions) => {
      try {
        const result = await runArtifactsInspectCommand(options);
        printInspectSummary(result);
        process.exitCode = result.validation.valid ? 0 : 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown artifact inspection error";
        console.error(`OpenVisi artifact inspection failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runArtifactsInspectCommand(
  options: ArtifactsInspectOptions
): Promise<ArtifactsInspectResult> {
  const expectedStage = parseStage(options.stage);
  const bundle = await readArtifactBundle(options.output, {
    ...(expectedStage ? { expectedStage } : {}),
    requireReportReferences: expectedStage === "static-crawl"
  });
  const missingArtifacts = bundle.validation.issues
    .filter((issue) => issue.severity === "error" && issue.path)
    .map((issue) => issue.path as string);

  return {
    outputDir: bundle.outputDir,
    stage: bundle.manifest.stage,
    artifactCount: bundle.manifest.artifacts.length,
    missingArtifacts,
    warnings: [...bundle.manifest.warnings],
    validation: bundle.validation
  };
}

function printInspectSummary(result: ArtifactsInspectResult): void {
  console.log(`Output directory: ${result.outputDir}`);
  console.log(`Stage: ${result.stage}`);
  console.log(`Artifact count: ${result.artifactCount}`);
  console.log(
    `Missing artifacts: ${result.missingArtifacts.length > 0 ? result.missingArtifacts.join(", ") : "none"}`
  );

  if (result.warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of result.warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (result.validation.issues.length > 0) {
    console.log("Validation issues:");
    for (const issue of result.validation.issues) {
      console.log(`- [${issue.severity}] ${issue.message}`);
    }
  }
}

function parseStage(stage: string | undefined): ArtifactBundleStage | undefined {
  if (!stage) return undefined;
  if (
    stage === "dry-run" ||
    stage === "static-crawl" ||
    stage === "evaluation" ||
    stage === "measurement-inputs" ||
    stage === "metrics-draft" ||
    stage === "metrics-review" ||
    stage === "metrics-finalization" ||
    stage === "full-scan" ||
    stage === "report" ||
    stage === "unknown"
  ) {
    return stage;
  }

  throw new Error(`Unsupported artifact bundle stage: ${stage}`);
}
