import { constants } from "node:fs";
import { access, mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  validateMetricsDraftBundleShape,
  validateMetricsFinalizationBundleShape,
  validateMetricsReviewBundleShape
} from "@openvisi/core";
import { runArtifactsInspectCommand } from "./artifacts.js";
import {
  runMetricsDraftCommand,
  runMetricsGuardCommand,
  runMetricsReviewCommand
} from "./metrics.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");

describe("runMetricsDraftCommand", () => {
  it("composes metrics-draft from a measurement-inputs bundle", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-draft-"));

    const result = await runMetricsDraftCommand({
      measurementOutput: path.join(fixtureRoot, "measurement-inputs"),
      output
    });

    const metricsDraft = (await readJson(path.join(output, "metrics-draft.json"))) as {
      evidenceMode: string;
      draftMetrics: Record<string, { value: number | null; available: boolean }>;
      excludedMetrics: Array<{ name: string }>;
    };
    const manifest = (await readJson(path.join(output, "artifact-manifest.json"))) as {
      stage: string;
      artifacts: Array<{ id: string; path: string }>;
    };
    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const inspect = await runArtifactsInspectCommand({ output, stage: "metrics-draft" });

    expect(result.evidenceMode).toBe("mock");
    expect(validateMetricsDraftBundleShape(metricsDraft)).toEqual([]);
    expect(metricsDraft.draftMetrics.answerPresence?.value).toBe(1);
    expect(metricsDraft.draftMetrics.narrativeAccuracy?.available).toBe(false);
    expect("aiVisibilityScore" in metricsDraft.draftMetrics).toBe(false);
    expect(metricsDraft.excludedMetrics.map((metric) => metric.name)).toContain("aiVisibilityScore");
    expect(manifest.stage).toBe("metrics-draft");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "metrics-draft",
      "warnings",
      "artifact-manifest"
    ]);
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "metrics-draft.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(warnings).toContain("Metrics draft uses mock evaluator signals and is not real LLM evidence.");
    expect(warnings).toContain("Final aiVisibilityScore is not computed in Stage 4A.");
    expect(inspect.validation.valid).toBe(true);
  });

  it("writes only metrics draft bundle artifacts", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-draft-only-"));

    await runMetricsDraftCommand({
      measurementOutput: path.join(fixtureRoot, "measurement-inputs"),
      output
    });

    expect((await readdir(output)).sort()).toEqual([
      "artifact-manifest.json",
      "metrics-draft.json",
      "warnings.json"
    ]);
    for (const forbiddenPath of [
      "metrics.json",
      "metrics-review.json",
      "metrics-finalization.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "measurement-inputs.json",
      "answers.json",
      "crawled-pages.json",
      "citations.json"
    ]) {
      await expect(fileExists(path.join(output, forbiddenPath))).resolves.toBe(false);
    }
  });

  it("fails clearly when measurement-output is missing", async () => {
    const missingMeasurementOutput = await mkdtemp(path.join(tmpdir(), "openvisi-missing-measurement-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-draft-missing-"));

    await expect(
      runMetricsDraftCommand({
        measurementOutput: missingMeasurementOutput,
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when the source bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-draft-wrong-stage-"));

    await expect(
      runMetricsDraftCommand({
        measurementOutput: path.join(fixtureRoot, "evaluation"),
        output
      })
    ).rejects.toThrow("Invalid measurement input artifact bundle");
  });

  it("does not allow writing over the source bundle", async () => {
    await expect(
      runMetricsDraftCommand({
        measurementOutput: path.join(fixtureRoot, "measurement-inputs"),
        output: path.join(fixtureRoot, "measurement-inputs")
      })
    ).rejects.toThrow("output must be separate from the measurement input bundle");
  });
});

describe("runMetricsGuardCommand", () => {
  it("creates metrics-finalization and blocks final metrics under mock evidence", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-finalization-"));

    const result = await runMetricsGuardCommand({
      metricsReviewOutput: path.join(fixtureRoot, "metrics-review"),
      output
    });

    const finalization = (await readJson(path.join(output, "metrics-finalization.json"))) as {
      status: string;
      decision: {
        allowedToGenerateMetricsJson: boolean;
        allowedToComputeAiVisibilityScore: boolean;
        allowedToGenerateScanResult: boolean;
      };
      readiness: { readyForFinalMetrics: boolean; readyForAiVisibilityScore: boolean };
    };
    const manifest = (await readJson(path.join(output, "artifact-manifest.json"))) as {
      stage: string;
      artifacts: Array<{ id: string; path: string }>;
    };
    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const inspect = await runArtifactsInspectCommand({ output, stage: "metrics-finalization" });

    expect(result.status).toBe("blocked");
    expect(result.allowedToGenerateMetricsJson).toBe(false);
    expect(result.allowedToComputeAiVisibilityScore).toBe(false);
    expect(validateMetricsFinalizationBundleShape(finalization)).toEqual([]);
    expect(finalization.readiness.readyForFinalMetrics).toBe(false);
    expect(finalization.readiness.readyForAiVisibilityScore).toBe(false);
    expect(finalization.decision.allowedToGenerateMetricsJson).toBe(false);
    expect(finalization.decision.allowedToComputeAiVisibilityScore).toBe(false);
    expect(finalization.decision.allowedToGenerateScanResult).toBe(false);
    expect(manifest.stage).toBe("metrics-finalization");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "metrics-finalization",
      "warnings",
      "artifact-manifest"
    ]);
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "metrics-finalization.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(warnings).toContain("Final metrics generation is blocked by the metrics review gate.");
    expect(warnings).toContain(
      "Mock evaluator evidence cannot produce production-ready final metrics."
    );
    expect(warnings).toContain(
      "Final aiVisibilityScore is not allowed by the finalization guard."
    );
    expect(inspect.validation.valid).toBe(true);
  });

  it("writes only metrics finalization bundle artifacts", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-finalization-only-"));

    await runMetricsGuardCommand({
      metricsReviewOutput: path.join(fixtureRoot, "metrics-review"),
      output
    });

    expect((await readdir(output)).sort()).toEqual([
      "artifact-manifest.json",
      "metrics-finalization.json",
      "warnings.json"
    ]);
    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "metrics-review.json",
      "metrics-draft.json",
      "measurement-inputs.json",
      "answers.json",
      "crawled-pages.json",
      "citations.json"
    ]) {
      await expect(fileExists(path.join(output, forbiddenPath))).resolves.toBe(false);
    }
  });

  it("fails clearly when metrics-review-output is missing", async () => {
    const missingMetricsReviewOutput = await mkdtemp(path.join(tmpdir(), "openvisi-missing-review-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-finalization-missing-"));

    await expect(
      runMetricsGuardCommand({
        metricsReviewOutput: missingMetricsReviewOutput,
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when the source bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-finalization-wrong-stage-"));

    await expect(
      runMetricsGuardCommand({
        metricsReviewOutput: path.join(fixtureRoot, "metrics-draft"),
        output
      })
    ).rejects.toThrow("Invalid metrics review artifact bundle");
  });

  it("does not allow writing over the source bundle", async () => {
    await expect(
      runMetricsGuardCommand({
        metricsReviewOutput: path.join(fixtureRoot, "metrics-review"),
        output: path.join(fixtureRoot, "metrics-review")
      })
    ).rejects.toThrow("output must be separate from the metrics review bundle");
  });
});

describe("runMetricsReviewCommand", () => {
  it("reviews metrics-draft and blocks finalization for mock evidence", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-review-"));

    const result = await runMetricsReviewCommand({
      metricsDraftOutput: path.join(fixtureRoot, "metrics-draft"),
      output
    });

    const metricsReview = (await readJson(path.join(output, "metrics-review.json"))) as {
      evidenceMode: string;
      readiness: { readyForFinalMetrics: boolean; readyForAiVisibilityScore: boolean };
      metricReviews: Record<string, { decision: string }>;
    };
    const manifest = (await readJson(path.join(output, "artifact-manifest.json"))) as {
      stage: string;
      artifacts: Array<{ id: string; path: string }>;
    };
    const warnings = (await readJson(path.join(output, "warnings.json"))) as string[];
    const inspect = await runArtifactsInspectCommand({ output, stage: "metrics-review" });

    expect(result.evidenceMode).toBe("mock");
    expect(result.readyForFinalMetrics).toBe(false);
    expect(result.readyForAiVisibilityScore).toBe(false);
    expect(validateMetricsReviewBundleShape(metricsReview)).toEqual([]);
    expect(metricsReview.readiness.readyForFinalMetrics).toBe(false);
    expect(metricsReview.readiness.readyForAiVisibilityScore).toBe(false);
    expect(metricsReview.metricReviews.answerPresence?.decision).toBe("blocked");
    expect(metricsReview.metricReviews.aiReadableStructure?.decision).toBe("review_required");
    expect(manifest.stage).toBe("metrics-review");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual([
      "metrics-review",
      "warnings",
      "artifact-manifest"
    ]);
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "metrics-review.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    expect(warnings).toContain(
      "Metrics review blocked finalization because evaluator evidence is mock."
    );
    expect(warnings).toContain("Final aiVisibilityScore is not computed in Stage 4B.");
    expect(inspect.validation.valid).toBe(true);
  });

  it("writes only metrics review bundle artifacts", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-review-only-"));

    await runMetricsReviewCommand({
      metricsDraftOutput: path.join(fixtureRoot, "metrics-draft"),
      output
    });

    expect((await readdir(output)).sort()).toEqual([
      "artifact-manifest.json",
      "metrics-review.json",
      "warnings.json"
    ]);
    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "metrics-draft.json",
      "metrics-finalization.json",
      "measurement-inputs.json",
      "answers.json",
      "crawled-pages.json",
      "citations.json"
    ]) {
      await expect(fileExists(path.join(output, forbiddenPath))).resolves.toBe(false);
    }
  });

  it("fails clearly when metrics-draft-output is missing", async () => {
    const missingMetricsDraftOutput = await mkdtemp(path.join(tmpdir(), "openvisi-missing-draft-"));
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-review-missing-"));

    await expect(
      runMetricsReviewCommand({
        metricsDraftOutput: missingMetricsDraftOutput,
        output
      })
    ).rejects.toThrow("artifact-manifest.json was not found");
  });

  it("fails clearly when the source bundle has the wrong stage", async () => {
    const output = await mkdtemp(path.join(tmpdir(), "openvisi-metrics-review-wrong-stage-"));

    await expect(
      runMetricsReviewCommand({
        metricsDraftOutput: path.join(fixtureRoot, "measurement-inputs"),
        output
      })
    ).rejects.toThrow("Invalid metrics draft artifact bundle");
  });

  it("does not allow writing over the source bundle", async () => {
    await expect(
      runMetricsReviewCommand({
        metricsDraftOutput: path.join(fixtureRoot, "metrics-draft"),
        output: path.join(fixtureRoot, "metrics-draft")
      })
    ).rejects.toThrow("output must be separate from the metrics draft bundle");
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
