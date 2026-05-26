import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Command } from "commander";
import {
  createMeasurementInputBundle,
  validateAnswerSignalInputBundleShape,
  validateMeasurementInputBundleShape,
  validateStructureTrustInputBundleShape,
  type AnswerSignalInputBundle,
  type ArtifactBundleValidationResult,
  type StructureTrustInputBundle
} from "@openvisi/core";
import { readArtifactBundle, resolveArtifactPath } from "../artifactReader.js";
import { artifactById, createArtifactManifest } from "../artifacts.js";
import { ensureOutputDir, removeKnownArtifactFiles, writeJsonFile } from "../output.js";

export interface InputsComposeOptions {
  crawlOutput: string;
  evalOutput: string;
  output: string;
}

export interface InputsComposeResult {
  outputDir: string;
  pageCount: number;
  answerCount: number;
  warnings: string[];
}

const outputFileNames = [
  "measurement-inputs.json",
  "artifact-manifest.json",
  "warnings.json"
];

const forbiddenOutputFileNames = [
  "scan-plan.json",
  "prompt-pack.json",
  "config.normalized.json",
  "crawled-pages.json",
  "crawler-summary.json",
  "structure-trust-inputs.json",
  "answers.json",
  "answer-signal-inputs.json",
  "report-references.json",
  "metrics.json",
  "citations.json",
  "scan-result.json",
  "debug-report.md",
  "report.md",
  "report.html"
];

export function registerInputsCommand(program: Command): void {
  const inputs = program
    .command("inputs")
    .description("Compose downstream OpenVisi input artifacts.");

  inputs
    .command("compose")
    .description("Compose measurement-inputs.json from static crawl and evaluation bundles.")
    .option("--crawl-output <directory>", "Static crawl artifact bundle directory", "openvisi-crawl")
    .option("--eval-output <directory>", "Evaluation artifact bundle directory", "openvisi-eval")
    .option("-o, --output <directory>", "Measurement input artifact output directory", "openvisi-measurement")
    .action(async (options: InputsComposeOptions) => {
      try {
        const result = await runInputsComposeCommand(options);
        console.log(`OpenVisi measurement input artifacts written to: ${result.outputDir}`);
        console.log(`Pages: ${result.pageCount}`);
        console.log(`Answers: ${result.answerCount}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown input composition error";
        console.error(`OpenVisi inputs compose failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runInputsComposeCommand(
  options: InputsComposeOptions
): Promise<InputsComposeResult> {
  const crawlOutput = path.resolve(process.cwd(), options.crawlOutput);
  const evalOutput = path.resolve(process.cwd(), options.evalOutput);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (outputDir === crawlOutput || outputDir === evalOutput) {
    throw new Error("Measurement input output must be separate from source artifact bundles.");
  }

  const crawlBundle = await readArtifactBundle(crawlOutput, { expectedStage: "static-crawl" });
  assertValidBundle("static crawl", crawlBundle.validation);

  const evaluationBundle = await readArtifactBundle(evalOutput, { expectedStage: "evaluation" });
  assertValidBundle("evaluation", evaluationBundle.validation);

  const structureTrustInputs = await readValidatedJson<StructureTrustInputBundle>(
    resolveArtifactPath(crawlOutput, "structure-trust-inputs.json"),
    validateStructureTrustInputBundleShape,
    "structure-trust-inputs.json"
  );
  const answerSignalInputs = await readValidatedJson<AnswerSignalInputBundle>(
    resolveArtifactPath(evalOutput, "answer-signal-inputs.json"),
    validateAnswerSignalInputBundleShape,
    "answer-signal-inputs.json"
  );

  const generatedAt = new Date().toISOString();
  const measurementInputs = createMeasurementInputBundle({
    generatedAt,
    staticCrawlBundlePath: options.crawlOutput,
    evaluationBundlePath: options.evalOutput,
    structureTrustInputs,
    answerSignalInputs
  });
  const measurementErrors = validateMeasurementInputBundleShape(measurementInputs);

  if (measurementErrors.length > 0) {
    throw new Error(
      `Generated measurement input artifact is invalid:\n${measurementErrors
        .map((error) => `- ${error}`)
        .join("\n")}`
    );
  }

  const warnings = [
    "measurement-inputs.json is an input artifact and does not compute metrics.",
    "measurement-inputs.json does not include aiVisibilityScore."
  ];

  if (answerSignalInputs.provider === "mock") {
    warnings.push(
      "Measurement inputs include mock evaluator signals and are not real LLM evidence."
    );
  }

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [...outputFileNames, ...forbiddenOutputFileNames]);
  await writeJsonFile(path.join(outputDir, "measurement-inputs.json"), measurementInputs);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "measurement-inputs",
      artifacts: [
        generatedArtifact("measurement-inputs"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return {
    outputDir,
    pageCount: measurementInputs.evidenceSummary.pageCount,
    answerCount: measurementInputs.evidenceSummary.answerCount,
    warnings
  };
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

function generatedArtifact(id: string) {
  return {
    ...artifactById(id),
    generated: true
  };
}
