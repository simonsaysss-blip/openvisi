import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readArtifactBundle,
  readArtifactManifest,
  readReportReferences,
  resolveArtifactPath,
  validateArtifactBundle
} from "./artifactReader.js";

const fixtureRoot = path.resolve(process.cwd(), "test/fixtures/artifact-bundles");

describe("artifact bundle reader", () => {
  it("reads the dry-run golden fixture", async () => {
    const bundle = await readArtifactBundle(path.join(fixtureRoot, "dry-run"), {
      expectedStage: "dry-run"
    });

    expect(bundle.manifest.stage).toBe("dry-run");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.existingArtifactPaths).toEqual([
      "scan-plan.json",
      "prompt-pack.json",
      "config.normalized.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
  });

  it("reads the static-crawl golden fixture", async () => {
    const bundle = await readArtifactBundle(path.join(fixtureRoot, "static-crawl"), {
      expectedStage: "static-crawl",
      requireReportReferences: true
    });

    expect(bundle.manifest.stage).toBe("static-crawl");
    expect(bundle.reportReferences?.references).toHaveLength(6);
    expect(bundle.validation.valid).toBe(true);
  });

  it("validates the dry-run golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "dry-run"), { expectedStage: "dry-run" })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the static-crawl golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "static-crawl"), {
        expectedStage: "static-crawl",
        requireReportReferences: true
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the evaluation golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "evaluation"), {
        expectedStage: "evaluation"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the measurement-inputs golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "measurement-inputs"), {
        expectedStage: "measurement-inputs"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the metrics-draft golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "metrics-draft"), {
        expectedStage: "metrics-draft"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the metrics-review golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "metrics-review"), {
        expectedStage: "metrics-review"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the metrics-finalization golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "metrics-finalization"), {
        expectedStage: "metrics-finalization"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("validates the debug-report golden fixture", async () => {
    await expect(
      validateArtifactBundle(path.join(fixtureRoot, "debug-report"), {
        expectedStage: "debug-report"
      })
    ).resolves.toMatchObject({ valid: true });
  });

  it("fails validation for the missing-file negative fixture", async () => {
    const validation = await validateArtifactBundle(path.join(fixtureRoot, "invalid-missing-file"), {
      expectedStage: "dry-run"
    });

    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.path)).toContain("scan-plan.json");
  });

  it("rejects the absolute-path negative fixture", async () => {
    await expect(readArtifactManifest(path.join(fixtureRoot, "invalid-absolute-path"))).rejects.toThrow(
      "must be relative"
    );
  });

  it("reads a valid artifact-manifest.json", async () => {
    const directory = await createDryRunBundle();

    const manifest = await readArtifactManifest(directory);

    expect(manifest.stage).toBe("dry-run");
    expect(manifest.artifacts.map((artifact) => artifact.id)).toContain("scan-plan");
  });

  it("returns reportReferences when present", async () => {
    const directory = await createStaticCrawlBundle();

    const bundle = await readArtifactBundle(directory, { expectedStage: "static-crawl" });

    expect(bundle.reportReferences?.references.map((reference) => reference.section)).toEqual([
      "AI-readable Structure",
      "Machine-readable Trust",
      "AI Citation Signals",
      "Source Gaps",
      "Raw Crawled Pages",
      "Crawler Summary"
    ]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("works when reportReferences are absent and not required", async () => {
    const directory = await createDryRunBundle();

    const references = await readReportReferences(directory);
    const bundle = await readArtifactBundle(directory, { expectedStage: "dry-run" });

    expect(references).toBeNull();
    expect(bundle.reportReferences).toBeNull();
    expect(bundle.validation.valid).toBe(true);
  });

  it("detects missing files referenced by the manifest", async () => {
    const directory = await createDryRunBundle();
    const manifestPath = path.join(directory, "artifact-manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      artifacts: Array<{
        id: string;
        type: string;
        path: string;
        description: string;
        generated: boolean;
        requiredFor: string[];
        stage: string;
      }>;
    };
    manifest.artifacts.push(artifact("missing-artifact", "unknown", "missing-artifact.json"));
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

    const validation = await validateArtifactBundle(directory, { expectedStage: "dry-run" });

    expect(validation.valid).toBe(false);
    expect(validation.issues.map((issue) => issue.path)).toContain("missing-artifact.json");
  });

  it("resolves relative artifact paths under the output directory", () => {
    expect(resolveArtifactPath("/tmp/openvisi-report", "scan-plan.json")).toBe(
      "/tmp/openvisi-report/scan-plan.json"
    );
  });
});

async function createDryRunBundle(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "openvisi-reader-dry-run-"));
  await writeJson(path.join(directory, "scan-plan.json"), {});
  await writeJson(path.join(directory, "prompt-pack.json"), []);
  await writeJson(path.join(directory, "config.normalized.json"), {});
  await writeJson(path.join(directory, "warnings.json"), []);
  await writeJson(path.join(directory, "artifact-manifest.json"), {
    schemaVersion: "0.1",
    project: "OpenVisi",
    generatedAt: "2026-05-26T00:00:00.000Z",
    stage: "dry-run",
    artifacts: [
      artifact("scan-plan", "scan-plan", "scan-plan.json"),
      artifact("prompt-pack", "prompt-pack", "prompt-pack.json"),
      artifact("config.normalized", "config", "config.normalized.json"),
      artifact("warnings", "warnings", "warnings.json"),
      artifact("artifact-manifest", "unknown", "artifact-manifest.json")
    ],
    warnings: []
  });
  return directory;
}

async function createStaticCrawlBundle(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "openvisi-reader-static-crawl-"));
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
    stage: "static-crawl",
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
