import { constants } from "node:fs";
import { access, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateMeasurementInputBundleShape } from "@openvisi/core";
import { runArtifactsInspectCommand } from "./artifacts.js";
import { runInputsComposeCommand } from "./inputs.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");

describe("runInputsComposeCommand", () => {
  it("composes measurement-inputs from static-crawl and evaluation bundles", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-"));

    const result = await runInputsComposeCommand({
      crawlOutput: path.join(fixtureRoot, "static-crawl"),
      evalOutput: path.join(fixtureRoot, "evaluation"),
      output
    });

    const measurementInputs = (await readJson(path.join(output, "measurement-inputs.json"))) as {
      evidenceSummary: { pageCount: number; answerCount: number; provider: string; model: string };
      inputCompleteness: { readyForMetricsComposition: boolean };
    };
    const manifest = (await readJson(path.join(output, "artifact-manifest.json"))) as {
      stage: string;
      artifacts: Array<{ id: string; path: string }>;
    };
    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const inspect = await runArtifactsInspectCommand({ output, stage: "measurement-inputs" });

    expect(result.pageCount).toBe(2);
    expect(result.answerCount).toBe(2);
    expect(validateMeasurementInputBundleShape(measurementInputs)).toEqual([]);
    expect(measurementInputs.evidenceSummary).toEqual({
      pageCount: 2,
      answerCount: 2,
      provider: "mock",
      model: "mock-v0"
    });
    expect(measurementInputs.inputCompleteness.readyForMetricsComposition).toBe(true);
    expect(manifest.stage).toBe("measurement-inputs");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "measurement-inputs",
      "warnings",
      "artifact-manifest"
    ]);
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "measurement-inputs.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(warnings).toContain(
      "Measurement inputs include mock evaluator signals and are not real LLM evidence."
    );
    expect(inspect.validation.valid).toBe(true);
  });

  it("writes only measurement input bundle artifacts", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-only-"));

    await runInputsComposeCommand({
      crawlOutput: path.join(fixtureRoot, "static-crawl"),
      evalOutput: path.join(fixtureRoot, "evaluation"),
      output
    });

    expect((await readdir(output)).sort()).toEqual([
      "artifact-manifest.json",
      "measurement-inputs.json",
      "warnings.json"
    ]);
    for (const forbiddenPath of [
      "metrics.json",
      "metrics-draft.json",
      "metrics-review.json",
      "metrics-finalization.json",
      "answers.json",
      "crawled-pages.json",
      "structure-trust-inputs.json",
      "answer-signal-inputs.json",
      "citations.json",
      "scan-result.json",
      "report.md",
      "report.html"
    ]) {
      await expect(fileExists(path.join(output, forbiddenPath))).resolves.toBe(false);
    }
  });

  it("fails clearly when the crawl bundle is missing", async () => {
    const missingCrawlOutput = await mkdtemp(path.join(tmpdir(), "openvisi-missing-crawl-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-missing-crawl-"));

    await expect(
      runInputsComposeCommand({
        crawlOutput: missingCrawlOutput,
        evalOutput: path.join(fixtureRoot, "evaluation"),
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when the evaluation bundle is missing", async () => {
    const missingEvalOutput = await mkdtemp(path.join(tmpdir(), "openvisi-missing-eval-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-missing-eval-"));

    await expect(
      runInputsComposeCommand({
        crawlOutput: path.join(fixtureRoot, "static-crawl"),
        evalOutput: missingEvalOutput,
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when the crawl bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-bad-crawl-"));

    await expect(
      runInputsComposeCommand({
        crawlOutput: path.join(fixtureRoot, "evaluation"),
        evalOutput: path.join(fixtureRoot, "evaluation"),
        output
      })
    ).rejects.toThrow("Invalid static crawl artifact bundle");
  });

  it("fails clearly when the evaluation bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-measurement-bad-eval-"));

    await expect(
      runInputsComposeCommand({
        crawlOutput: path.join(fixtureRoot, "static-crawl"),
        evalOutput: path.join(fixtureRoot, "static-crawl"),
        output
      })
    ).rejects.toThrow("Invalid evaluation artifact bundle");
  });

  it("does not allow writing over a source bundle", async () => {
    await expect(
      runInputsComposeCommand({
        crawlOutput: path.join(fixtureRoot, "static-crawl"),
        evalOutput: path.join(fixtureRoot, "evaluation"),
        output: path.join(fixtureRoot, "static-crawl")
      })
    ).rejects.toThrow("output must be separate from source artifact bundles");
  });
});

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
