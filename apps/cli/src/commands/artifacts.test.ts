import { constants } from "node:fs";
import { access, mkdtemp, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runArtifactsInspectCommand } from "./artifacts.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");

describe("runArtifactsInspectCommand", () => {
  it("succeeds against the dry-run golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "dry-run"),
      stage: "dry-run"
    });

    expect(result.stage).toBe("dry-run");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the static-crawl golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "static-crawl"),
      stage: "static-crawl"
    });

    expect(result.stage).toBe("static-crawl");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the evaluation golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "evaluation"),
      stage: "evaluation"
    });

    expect(result.stage).toBe("evaluation");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the measurement-inputs golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "measurement-inputs"),
      stage: "measurement-inputs"
    });

    expect(result.stage).toBe("measurement-inputs");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the metrics-draft golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "metrics-draft"),
      stage: "metrics-draft"
    });

    expect(result.stage).toBe("metrics-draft");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the metrics-review golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "metrics-review"),
      stage: "metrics-review"
    });

    expect(result.stage).toBe("metrics-review");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds against the metrics-finalization golden fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "metrics-finalization"),
      stage: "metrics-finalization"
    });

    expect(result.stage).toBe("metrics-finalization");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("reports validation errors for the missing-file negative fixture", async () => {
    const result = await runArtifactsInspectCommand({
      output: path.join(fixtureRoot, "invalid-missing-file"),
      stage: "dry-run"
    });

    expect(result.validation.valid).toBe(false);
    expect(result.missingArtifacts).toContain("scan-plan.json");
  });

  it("succeeds for a valid dry-run bundle", async () => {
    const directory = await createBundle("dry-run");

    const result = await runArtifactsInspectCommand({ output: directory, stage: "dry-run" });

    expect(result.stage).toBe("dry-run");
    expect(result.validation.valid).toBe(true);
    expect(result.missingArtifacts).toEqual([]);
  });

  it("succeeds for a valid static-crawl bundle", async () => {
    const directory = await createBundle("static-crawl");

    const result = await runArtifactsInspectCommand({ output: directory, stage: "static-crawl" });

    expect(result.stage).toBe("static-crawl");
    expect(result.validation.valid).toBe(true);
    expect(result.warnings).toContain("Crawler artifacts are static-only in Stage 2B.");
  });

  it("returns an error for a missing manifest", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-missing-manifest-"));

    await expect(runArtifactsInspectCommand({ output: directory })).rejects.toThrow(
      "artifact-manifest.json was not found"
    );
  });

  it("does not write new files during inspection", async () => {
    const directory = path.join(fixtureRoot, "dry-run");
    const before = await readdir(directory);

    await runArtifactsInspectCommand({ output: directory, stage: "dry-run" });

    await expect(fileExists(path.join(directory, "scan-result.json"))).resolves.toBe(false);
    expect(await readdir(directory)).toEqual(before);
  });
});

async function createBundle(stage: "dry-run" | "static-crawl"): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), `openvisi-inspect-${stage}-`));

  if (stage === "dry-run") {
    await writeJson(path.join(directory, "scan-plan.json"), {});
    await writeJson(path.join(directory, "prompt-pack.json"), []);
    await writeJson(path.join(directory, "config.normalized.json"), {});
    await writeJson(path.join(directory, "warnings.json"), []);
    await writeJson(path.join(directory, "artifact-manifest.json"), {
      schemaVersion: "0.1",
      project: "OpenVisi",
      generatedAt: "2026-05-26T00:00:00.000Z",
      stage,
      artifacts: [
        artifact("scan-plan", "scan-plan", "scan-plan.json"),
        artifact("prompt-pack", "prompt-pack", "prompt-pack.json"),
        artifact("config.normalized", "config", "config.normalized.json"),
        artifact("warnings", "warnings", "warnings.json"),
        artifact("artifact-manifest", "unknown", "artifact-manifest.json")
      ],
      warnings: []
    });
  } else {
    await writeJson(path.join(directory, "crawled-pages.json"), []);
    await writeJson(path.join(directory, "crawler-summary.json"), {});
    await writeJson(path.join(directory, "structure-trust-inputs.json"), {});
    await writeJson(path.join(directory, "warnings.json"), []);
    await writeJson(path.join(directory, "report-references.json"), {
      schemaVersion: "0.1",
      generatedAt: "2026-05-26T00:00:00.000Z",
      references: [
        reference("AI-readable Structure", "structure-trust-inputs", "structure-trust-inputs.json"),
        reference("Machine-readable Trust", "structure-trust-inputs", "structure-trust-inputs.json"),
        reference("AI Citation Signals", "structure-trust-inputs", "structure-trust-inputs.json"),
        reference("Source Gaps", "structure-trust-inputs", "structure-trust-inputs.json"),
        reference("Raw Crawled Pages", "crawled-pages", "crawled-pages.json"),
        reference("Crawler Summary", "crawler-summary", "crawler-summary.json")
      ]
    });
    await writeJson(path.join(directory, "artifact-manifest.json"), {
      schemaVersion: "0.1",
      project: "OpenVisi",
      generatedAt: "2026-05-26T00:00:00.000Z",
      stage,
      artifacts: [
        artifact("crawled-pages", "crawled-pages", "crawled-pages.json"),
        artifact("crawler-summary", "crawler-summary", "crawler-summary.json"),
        artifact("structure-trust-inputs", "structure-trust-inputs", "structure-trust-inputs.json"),
        artifact("warnings", "warnings", "warnings.json"),
        artifact("report-references", "report-reference", "report-references.json"),
        artifact("artifact-manifest", "unknown", "artifact-manifest.json")
      ],
      warnings: ["Crawler artifacts are static-only in Stage 2B."]
    });
  }

  return directory;
}

function artifact(id: string, type: string, artifactPath: string) {
  return {
    id,
    type,
    path: artifactPath,
    description: `${id} artifact.`,
    generated: true,
    requiredFor: ["scan"],
    stage: "test"
  };
}

function reference(section: string, artifactId: string, artifactPath: string) {
  return {
    section,
    artifactId,
    path: artifactPath,
    description: `${section} reference.`
  };
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
