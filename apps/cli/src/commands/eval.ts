import path from "node:path";
import type { Command } from "commander";
import {
  validateAnswerSignalInputBundleShape,
  validateAnswersArtifactShape,
  validateScanConfig
} from "@openvisi/core";
import {
  createAnswerSignalInputBundle,
  createAnswersArtifact,
  createMockProvider,
  runEvaluator
} from "@openvisi/evaluator";
import { artifactById, createArtifactManifest } from "../artifacts.js";
import { loadOpenVisiConfig, materializeScanConfig } from "../config.js";
import { ensureOutputDir, removeKnownArtifactFiles, writeJsonFile } from "../output.js";

export interface EvalCommandOptions {
  config: string;
  output?: string;
  provider: string;
  model: string;
  includeExperimentalMetrics?: boolean;
}

const evaluationWarnings = [
  "Stage 3B evaluation uses the deterministic mock provider only.",
  "answers.json contains mock LLMAnswer objects and is not real LLM output.",
  "answer-signal-inputs.json is an input artifact, not final metrics.",
  "Evaluation does not compute metrics, citations, or scan results."
];

export function registerEvalCommand(program: Command): void {
  program
    .command("eval")
    .description("Generate mock evaluator answer artifacts without calling real LLM providers.")
    .option("--config <path>", "OpenVisi config path", "openvisi.config.json")
    .option("-o, --output <directory>", "Evaluation artifact output directory", "openvisi-report")
    .option("--provider <provider>", "Evaluator provider, currently only mock", "mock")
    .option("--model <model>", "Mock provider model label", "mock-v0")
    .option("--include-experimental-metrics", "Include experimental metrics flag in normalized config")
    .action(async (options: EvalCommandOptions) => {
      try {
        const result = await runEvalCommand(options);
        console.log(`OpenVisi evaluation artifacts written to: ${result.outputDir}`);
        console.log(`Provider: ${result.provider}`);
        console.log(`Answers: ${result.answerCount}`);
        process.exitCode = 0;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown evaluation error";
        console.error(`OpenVisi eval failed: ${message}`);
        process.exitCode = 1;
      }
    });
}

export async function runEvalCommand(options: EvalCommandOptions): Promise<{
  outputDir: string;
  provider: string;
  answerCount: number;
}> {
  if (options.provider !== "mock") {
    throw new Error("Real provider adapters are not implemented in Stage 3B. Use --provider mock.");
  }

  const input = await loadOpenVisiConfig(options.config);
  const config = materializeScanConfig(input, {
    ...(options.output ? { outputDir: options.output } : {}),
    provider: "mock",
    ...(options.includeExperimentalMetrics ? { includeExperimentalMetrics: true } : {})
  });
  const configErrors = validateScanConfig(config);

  if (configErrors.length > 0) {
    throw new Error(
      `Invalid OpenVisi scan config:\n${configErrors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  const generatedAt = new Date().toISOString();
  const outputDir = path.resolve(process.cwd(), config.outputDir);
  const evaluatorResult = await runEvaluator({
    config,
    provider: createMockProvider(),
    options: {
      provider: "mock",
      model: options.model
    }
  });
  const answersArtifact = createAnswersArtifact({
    generatedAt,
    provider: "mock",
    model: options.model,
    answers: evaluatorResult.answers
  });
  const answersErrors = validateAnswersArtifactShape(answersArtifact);

  if (answersErrors.length > 0) {
    throw new Error(
      `Generated answers artifact is invalid:\n${answersErrors.map((error) => `- ${error}`).join("\n")}`
    );
  }
  const answerSignalInputs = createAnswerSignalInputBundle({
    answersArtifact,
    config,
    generatedAt
  });
  const answerSignalErrors = validateAnswerSignalInputBundleShape(answerSignalInputs);

  if (answerSignalErrors.length > 0) {
    throw new Error(
      `Generated answer signal input artifact is invalid:\n${answerSignalErrors.map((error) => `- ${error}`).join("\n")}`
    );
  }

  const warnings = [...evaluationWarnings, ...evaluatorResult.warnings];

  await ensureOutputDir(outputDir);
  await removeKnownArtifactFiles(outputDir, [
    "scan-plan.json",
    "crawled-pages.json",
    "crawler-summary.json",
    "structure-trust-inputs.json",
    "report-references.json",
    "metrics.json",
    "citations.json",
    "scan-result.json",
    "debug-report.md",
    "report.md",
    "report.html"
  ]);
  await writeJsonFile(path.join(outputDir, "config.normalized.json"), config);
  await writeJsonFile(path.join(outputDir, "prompt-pack.json"), config.promptPack);
  await writeJsonFile(path.join(outputDir, "answers.json"), answersArtifact);
  await writeJsonFile(path.join(outputDir, "answer-signal-inputs.json"), answerSignalInputs);
  await writeJsonFile(path.join(outputDir, "warnings.json"), warnings);
  await writeJsonFile(
    path.join(outputDir, "artifact-manifest.json"),
    createArtifactManifest({
      generatedAt,
      stage: "evaluation",
      artifacts: [
        generatedArtifact("config.normalized"),
        generatedArtifact("prompt-pack"),
        generatedArtifact("answers"),
        generatedArtifact("answer-signal-inputs"),
        generatedArtifact("warnings"),
        generatedArtifact("artifact-manifest")
      ],
      warnings
    })
  );

  return {
    outputDir,
    provider: "mock",
    answerCount: evaluatorResult.answers.length
  };
}

function generatedArtifact(id: string) {
  return {
    ...artifactById(id),
    generated: true
  };
}
