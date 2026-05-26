import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  requiredArtifactsByStage,
  validateArtifactManifestShape,
  validateReportReferencesShape,
  type ArtifactBundleStage,
  type OpenVisiArtifactManifest,
  type ReportReferencesFile
} from "./artifacts.js";
import {
  validateStructureTrustInputBundleShape,
  type StructureTrustInputBundle
} from "./structureTrustInputs.js";
import {
  validateAnswerSignalInputBundleShape,
  type AnswerSignalInputBundle
} from "./answerSignalInputs.js";
import {
  validateMeasurementInputBundleShape,
  type MeasurementInputBundle
} from "./measurementInputs.js";
import {
  validateMetricsDraftBundleShape,
  type MetricsDraftBundle
} from "./metricsDraft.js";
import {
  validateMetricsReviewBundleShape,
  type MetricsReviewBundle
} from "./metricsReview.js";
import {
  validateMetricsFinalizationBundleShape,
  type MetricsFinalizationBundle
} from "./metricsFinalization.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");
const forbiddenArtifactPaths = [
  "crawled-pages.json",
  "crawler-summary.json",
  "structure-trust-inputs.json",
  "report-references.json",
  "metrics.json",
  "answers.json",
  "citations.json",
  "scan-result.json",
  "report.md",
  "report.html"
];
const forbiddenResultPaths = [
  "metrics.json",
  "answers.json",
  "citations.json",
  "scan-result.json",
  "report.md",
  "report.html"
];

describe("golden artifact bundle fixtures", () => {
  it("validates the dry-run fixture manifest shape", async () => {
    const manifest = await readManifest("dry-run");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
  });

  it("validates the static-crawl fixture manifest shape", async () => {
    const manifest = await readManifest("static-crawl");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
  });

  it("validates the static-crawl fixture report references shape", async () => {
    const references = await readReportReferences("static-crawl");

    expect(validateReportReferencesShape(references)).toEqual([]);
  });

  it("validates the static-crawl fixture structure trust input shape", async () => {
    const bundle = await readStructureTrustInputs("static-crawl");

    expect(validateStructureTrustInputBundleShape(bundle)).toEqual([]);
    expect("aiVisibilityScore" in bundle).toBe(false);
  });

  it("validates the evaluation fixture manifest shape", async () => {
    const manifest = await readManifest("evaluation");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
  });

  it("validates the evaluation fixture answer signal input shape", async () => {
    const bundle = await readAnswerSignalInputs("evaluation");

    expect(validateAnswerSignalInputBundleShape(bundle)).toEqual([]);
    expect("aiVisibilityScore" in bundle).toBe(false);
  });

  it("validates the measurement-inputs fixture shape", async () => {
    const manifest = await readManifest("measurement-inputs");
    const bundle = await readMeasurementInputs("measurement-inputs");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
    expect(validateMeasurementInputBundleShape(bundle)).toEqual([]);
    expect("aiVisibilityScore" in bundle).toBe(false);
    expect("metrics" in bundle).toBe(false);
  });

  it("validates the metrics-draft fixture shape", async () => {
    const manifest = await readManifest("metrics-draft");
    const bundle = await readMetricsDraft("metrics-draft");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
    expect(validateMetricsDraftBundleShape(bundle)).toEqual([]);
    expect("aiVisibilityScore" in bundle.draftMetrics).toBe(false);
    expect(bundle.excludedMetrics.map((metric) => metric.name)).toContain("aiVisibilityScore");
  });

  it("validates the metrics-review fixture shape", async () => {
    const manifest = await readManifest("metrics-review");
    const bundle = await readMetricsReview("metrics-review");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
    expect(validateMetricsReviewBundleShape(bundle)).toEqual([]);
    expect(bundle.readiness.readyForFinalMetrics).toBe(false);
    expect(bundle.readiness.readyForAiVisibilityScore).toBe(false);
  });

  it("validates the metrics-finalization fixture shape", async () => {
    const manifest = await readManifest("metrics-finalization");
    const bundle = await readMetricsFinalization("metrics-finalization");

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
    expect(validateMetricsFinalizationBundleShape(bundle)).toEqual([]);
    expect(bundle.status).toBe("blocked");
    expect(bundle.decision.allowedToGenerateMetricsJson).toBe(false);
    expect(bundle.decision.allowedToComputeAiVisibilityScore).toBe(false);
    expect(bundle.decision.allowedToGenerateScanResult).toBe(false);
  });

  it("validates the debug-report fixture manifest shape", async () => {
    const manifest = await readManifest("debug-report");
    const files = await readdir(path.join(fixtureRoot, "debug-report"));

    expect(validateArtifactManifestShape(manifest)).toEqual([]);
    expect(files).toContain("debug-report.md");
    expect(files).toContain("artifact-manifest.json");
    expect(files).toContain("warnings.json");
  });

  it("uses only relative fixture artifact paths", async () => {
    const manifests = [
      await readManifest("dry-run"),
      await readManifest("static-crawl"),
      await readManifest("evaluation"),
      await readManifest("measurement-inputs"),
      await readManifest("metrics-draft"),
      await readManifest("metrics-review"),
      await readManifest("metrics-finalization"),
      await readManifest("debug-report")
    ];

    for (const manifest of manifests) {
      expect(manifest.artifacts.every((artifact) => !path.isAbsolute(artifact.path))).toBe(true);
    }
  });

  it("keeps dry-run fixtures free of crawl, result, and report artifacts", async () => {
    const manifest = await readManifest("dry-run");
    const files = await readdir(path.join(fixtureRoot, "dry-run"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of forbiddenArtifactPaths) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps static-crawl fixtures free of metrics, answers, citations, scan results, and reports", async () => {
    const manifest = await readManifest("static-crawl");
    const files = await readdir(path.join(fixtureRoot, "static-crawl"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of forbiddenResultPaths) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps evaluation fixtures free of metrics, citations, scan results, reports, and crawl artifacts", async () => {
    const manifest = await readManifest("evaluation");
    const files = await readdir(path.join(fixtureRoot, "evaluation"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "citations.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "crawled-pages.json",
      "structure-trust-inputs.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps measurement-inputs fixtures free of upstream payloads, result artifacts, and reports", async () => {
    const manifest = await readManifest("measurement-inputs");
    const files = await readdir(path.join(fixtureRoot, "measurement-inputs"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "answers.json",
      "answer-signal-inputs.json",
      "crawled-pages.json",
      "structure-trust-inputs.json",
      "citations.json",
      "scan-result.json",
      "report.md",
      "report.html"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps metrics-draft fixtures free of source payloads, final result artifacts, and reports", async () => {
    const manifest = await readManifest("metrics-draft");
    const files = await readdir(path.join(fixtureRoot, "metrics-draft"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "citations.json",
      "answers.json",
      "measurement-inputs.json",
      "crawled-pages.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps metrics-review fixtures free of draft payloads, final result artifacts, and reports", async () => {
    const manifest = await readManifest("metrics-review");
    const files = await readdir(path.join(fixtureRoot, "metrics-review"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "citations.json",
      "answers.json",
      "measurement-inputs.json",
      "metrics-draft.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps metrics-finalization fixtures free of review payloads, final result artifacts, and reports", async () => {
    const manifest = await readManifest("metrics-finalization");
    const files = await readdir(path.join(fixtureRoot, "metrics-finalization"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "citations.json",
      "answers.json",
      "metrics-review.json",
      "metrics-draft.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("keeps debug-report fixtures free of raw, source, final result, and final report artifacts", async () => {
    const manifest = await readManifest("debug-report");
    const files = await readdir(path.join(fixtureRoot, "debug-report"));
    const manifestPaths = manifest.artifacts.map((artifact) => artifact.path);

    for (const forbiddenPath of [
      "metrics.json",
      "scan-result.json",
      "report.md",
      "report.html",
      "citations.json",
      "answers.json",
      "crawled-pages.json",
      "measurement-inputs.json",
      "metrics-draft.json",
      "metrics-review.json",
      "metrics-finalization.json"
    ]) {
      expect(files).not.toContain(forbiddenPath);
      expect(manifestPaths).not.toContain(forbiddenPath);
    }
  });

  it("matches required dry-run artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("dry-run");
  });

  it("matches required static-crawl artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("static-crawl");
  });

  it("matches required evaluation artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("evaluation");
  });

  it("matches required measurement-inputs artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("measurement-inputs");
  });

  it("matches required metrics-draft artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("metrics-draft");
  });

  it("matches required metrics-review artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("metrics-review");
  });

  it("matches required metrics-finalization artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("metrics-finalization");
  });

  it("matches required debug-report artifacts to fixture bundle contents", async () => {
    await expectRequiredArtifactsPresent("debug-report");
  });

  it("rejects the absolute-path negative fixture", async () => {
    const manifest = await readManifest("invalid-absolute-path");

    expect(validateArtifactManifestShape(manifest)).toContain(
      "artifacts[0].path must be relative, not absolute."
    );
  });
});

async function expectRequiredArtifactsPresent(stage: ArtifactBundleStage): Promise<void> {
  const manifest = await readManifest(stage);
  const artifactIds = manifest.artifacts.map((artifact) => artifact.id);
  const files = await readdir(path.join(fixtureRoot, stage));

  for (const requiredId of requiredArtifactsByStage[stage]) {
    expect(artifactIds).toContain(requiredId);
  }

  for (const artifact of manifest.artifacts) {
    expect(files).toContain(artifact.path);
  }
}

async function readManifest(fixtureName: string): Promise<OpenVisiArtifactManifest> {
  return readJson(path.join(fixtureRoot, fixtureName, "artifact-manifest.json"));
}

async function readReportReferences(fixtureName: string): Promise<ReportReferencesFile> {
  return readJson(path.join(fixtureRoot, fixtureName, "report-references.json"));
}

async function readStructureTrustInputs(fixtureName: string): Promise<StructureTrustInputBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "structure-trust-inputs.json"));
}

async function readAnswerSignalInputs(fixtureName: string): Promise<AnswerSignalInputBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "answer-signal-inputs.json"));
}

async function readMeasurementInputs(fixtureName: string): Promise<MeasurementInputBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "measurement-inputs.json"));
}

async function readMetricsDraft(fixtureName: string): Promise<MetricsDraftBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "metrics-draft.json"));
}

async function readMetricsReview(fixtureName: string): Promise<MetricsReviewBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "metrics-review.json"));
}

async function readMetricsFinalization(fixtureName: string): Promise<MetricsFinalizationBundle> {
  return readJson(path.join(fixtureRoot, fixtureName, "metrics-finalization.json"));
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}
