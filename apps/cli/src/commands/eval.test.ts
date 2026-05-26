import { constants } from "node:fs";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateAnswerSignalInputBundleShape, validateAnswersArtifactShape } from "@openvisi/core";
import { runArtifactsInspectCommand } from "./artifacts.js";
import { runEvalCommand } from "./eval.js";
import type { OpenVisiConfigInput } from "../config.js";

describe("runEvalCommand", () => {
  it("writes evaluation artifacts with deterministic mock answers", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-eval-"));
    const configPath = path.join(directory, "openvisi.config.json");
    const outputDir = path.join(directory, "openvisi-report");
    await writeFile(configPath, `${JSON.stringify(configInput(), null, 2)}\n`, "utf8");

    const result = await runEvalCommand({
      config: configPath,
      output: outputDir,
      provider: "mock",
      model: "mock-v0"
    });

    const answers = (await readJson(path.join(outputDir, "answers.json"))) as {
      provider: string;
      model: string;
      answers: Array<{
        promptId: string;
        provider: string;
        model: string;
        answerText: string;
        citations: unknown[];
        raw: { mock?: boolean };
      }>;
    };
    const answerSignals = (await readJson(path.join(outputDir, "answer-signal-inputs.json"))) as {
      answerCount: number;
      promptResults: Array<{ promptId: string; mockAnswer: boolean }>;
    };
    const manifest = (await readJson(path.join(outputDir, "artifact-manifest.json"))) as {
      stage: string;
      artifacts: Array<{ path: string }>;
    };
    const inspect = await runArtifactsInspectCommand({ output: outputDir, stage: "evaluation" });

    expect(result.answerCount).toBe(2);
    expect(validateAnswersArtifactShape(answers)).toEqual([]);
    expect(validateAnswerSignalInputBundleShape(answerSignals)).toEqual([]);
    expect(answers.provider).toBe("mock");
    expect(answers.model).toBe("mock-v0");
    expect(answers.answers.map((answer) => answer.promptId)).toEqual([
      "category-discovery-001",
      "brand-specific-001"
    ]);
    expect(answers.answers.every((answer) => answer.answerText.includes("[mock output]"))).toBe(true);
    expect(answers.answers.every((answer) => Array.isArray(answer.citations))).toBe(true);
    expect(answers.answers.every((answer) => answer.raw.mock === true)).toBe(true);
    expect(answerSignals.answerCount).toBe(2);
    expect(answerSignals.promptResults.map((result) => result.promptId)).toEqual([
      "category-discovery-001",
      "brand-specific-001"
    ]);
    expect(answerSignals.promptResults.every((result) => result.mockAnswer)).toBe(true);
    expect(manifest.stage).toBe("evaluation");
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "config.normalized.json",
      "prompt-pack.json",
      "answers.json",
      "answer-signal-inputs.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(inspect.validation.valid).toBe(true);
    await expect(fileExists(path.join(outputDir, "config.normalized.json"))).resolves.toBe(true);
    await expect(fileExists(path.join(outputDir, "prompt-pack.json"))).resolves.toBe(true);
    await expect(fileExists(path.join(outputDir, "warnings.json"))).resolves.toBe(true);
    await expect(fileExists(path.join(outputDir, "answer-signal-inputs.json"))).resolves.toBe(true);
    await expect(fileExists(path.join(outputDir, "metrics.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "citations.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "scan-result.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "report.md"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "report.html"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "measurement-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-draft.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-review.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-finalization.json"))).resolves.toBe(false);
  });

  it("rejects real provider placeholders in Stage 3B", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-eval-openai-"));
    const configPath = path.join(directory, "openvisi.config.json");
    await writeFile(configPath, `${JSON.stringify(configInput(), null, 2)}\n`, "utf8");

    await expect(
      runEvalCommand({
        config: configPath,
        output: path.join(directory, "openvisi-report"),
        provider: "openai",
        model: "gpt-placeholder"
      })
    ).rejects.toThrow(
      "Real provider adapters are not implemented in Stage 3B. Use --provider mock."
    );
  });
});

function configInput(): OpenVisiConfigInput {
  return {
    brandName: "OpenVisi",
    domain: "openvisi.dev",
    category: "AI Visibility diagnostics",
    competitors: [{ name: "Example Competitor", domain: "example.com" }],
    providers: [{ provider: "mock", model: "mock-v0", enabled: true }],
    outputDir: "openvisi-report",
    includeExperimentalMetrics: false,
    promptPack: [
      {
        id: "category-discovery-001",
        text: "What are the best AI Visibility diagnostics tools?",
        intent: "category_discovery",
        category: "AI Visibility diagnostics",
        expectedEntities: ["OpenVisi"]
      },
      {
        id: "brand-specific-001",
        text: "What does OpenVisi do?",
        intent: "brand_specific",
        category: "AI Visibility diagnostics",
        expectedEntities: ["OpenVisi"],
        targetEntity: "OpenVisi"
      }
    ]
  };
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
