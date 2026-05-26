import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runArtifactsInspectCommand } from "./artifacts.js";
import { runDebugReportCommand } from "./debug.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");

describe("runDebugReportCommand", () => {
  it("creates debug-report.md from the staged artifact fixtures", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-debug-report-"));

    const result = await runDebugReportCommand({
      ...fixtureOptions(),
      output
    });

    const files = (await readdir(output)).sort();
    const report = await readFile(path.join(output, "debug-report.md"), "utf8");
    const manifest = JSON.parse(await readFile(path.join(output, "artifact-manifest.json"), "utf8")) as {
      stage: string;
      artifacts: Array<{ id: string; path: string }>;
    };
    const warnings = JSON.parse(await readFile(path.join(output, "warnings.json"), "utf8")) as string[];
    const inspect = await runArtifactsInspectCommand({ output, stage: "debug-report" });

    expect(result.sourceStages).toEqual([
      "dry-run",
      "static-crawl",
      "evaluation",
      "measurement-inputs",
      "metrics-draft",
      "metrics-review",
      "metrics-finalization"
    ]);
    expect(files).toEqual(["artifact-manifest.json", "debug-report.md", "warnings.json"]);
    expect(manifest.stage).toBe("debug-report");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "debug-report",
      "warnings",
      "artifact-manifest"
    ]);
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "debug-report.md",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(report).toContain("# OpenVisi Artifact Debug Report");
    expect(report).toContain("This is not a final AI Visibility report.");
    expect(report).toContain("No final AI Visibility Score is computed.");
    expect(report).toContain("Mock evaluator evidence is not real LLM evidence.");
    expect(report).toContain("Final metrics generation is blocked by the finalization guard.");
    expect(report).toContain("## Artifact Chain");
    expect(report).toContain("## Metrics Draft");
    expect(report).toContain("## Finalization Guard");
    expect(warnings).toContain(
      "debug-report.md is an artifact debug report, not a final AI Visibility report."
    );
    expect(warnings).toContain("No final AI Visibility Score is computed in Stage 5A.");
    expect(inspect.validation.valid).toBe(true);
  });

  it("does not write final metrics, final reports, or raw payload artifacts", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-debug-report-only-"));

    await runDebugReportCommand({
      ...fixtureOptions(),
      output
    });

    const files = await readdir(output);
    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "answers.json",
      "crawled-pages.json",
      "measurement-inputs.json",
      "metrics-draft.json",
      "metrics-review.json",
      "metrics-finalization.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
    }
  });

  it("fails clearly when a required source bundle is missing", async () => {
    const missingOutput = await mkdtemp(path.join(tmpdir(), "openvisi-debug-missing-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-debug-report-missing-"));

    await expect(
      runDebugReportCommand({
        ...fixtureOptions(),
        dryRunOutput: missingOutput,
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when a source bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-debug-report-wrong-stage-"));

    await expect(
      runDebugReportCommand({
        ...fixtureOptions(),
        dryRunOutput: path.join(fixtureRoot, "evaluation"),
        output
      })
    ).rejects.toThrow("Invalid dry-run artifact bundle");
  });

  it("does not allow writing over a source bundle", async () => {
    await expect(
      runDebugReportCommand({
        ...fixtureOptions(),
        output: path.join(fixtureRoot, "metrics-finalization")
      })
    ).rejects.toThrow("Debug report output must be separate from source artifact bundles.");
  });
});

function fixtureOptions() {
  return {
    dryRunOutput: path.join(fixtureRoot, "dry-run"),
    crawlOutput: path.join(fixtureRoot, "static-crawl"),
    evalOutput: path.join(fixtureRoot, "evaluation"),
    measurementOutput: path.join(fixtureRoot, "measurement-inputs"),
    metricsDraftOutput: path.join(fixtureRoot, "metrics-draft"),
    metricsReviewOutput: path.join(fixtureRoot, "metrics-review"),
    metricsFinalizationOutput: path.join(fixtureRoot, "metrics-finalization")
  };
}
