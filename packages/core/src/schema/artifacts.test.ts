import { describe, expect, it } from "vitest";
import {
  artifactTypeDefinitions,
  requiredArtifactsByStage,
  validateArtifactBundleReferences,
  validateArtifactManifestShape,
  validateReportReferencesShape
} from "./artifacts.js";
import type { OpenVisiArtifactManifest, ReportReferencesFile } from "./artifacts.js";

describe("OpenVisi artifact contracts", () => {
  it("accepts a valid artifact manifest", () => {
    expect(validateArtifactManifestShape(validManifest())).toEqual([]);
  });

  it("rejects missing required manifest fields", () => {
    expect(validateArtifactManifestShape({})).toEqual([
      'schemaVersion must be "0.1".',
      'project must be "OpenVisi".',
      "generatedAt must be an ISO date string.",
      "stage must be a known artifact bundle stage.",
      "artifacts must be an array.",
      "warnings must be an array."
    ]);
  });

  it("rejects absolute artifact paths", () => {
    const manifest = validManifest();
    manifest.artifacts[0] = {
      ...manifest.artifacts[0]!,
      path: "/tmp/scan-plan.json"
    };

    expect(validateArtifactManifestShape(manifest)).toContain(
      "artifacts[0].path must be relative, not absolute."
    );
  });

  it("accepts valid report references", () => {
    expect(validateReportReferencesShape(validReportReferences())).toEqual([]);
  });

  it("detects missing artifact paths", () => {
    const result = validateArtifactBundleReferences({
      manifest: validManifest(),
      existingArtifactPaths: ["artifact-manifest.json"]
    });

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.message)).toContain(
      "Missing artifact file: scan-plan.json"
    );
  });

  it("defines required dry-run and static-crawl artifacts", () => {
    expect(requiredArtifactsByStage["dry-run"]).toContain("scan-plan");
    expect(requiredArtifactsByStage["static-crawl"]).toContain("crawled-pages");
    expect(requiredArtifactsByStage["static-crawl"]).toContain("structure-trust-inputs");
    expect(requiredArtifactsByStage["static-crawl"]).toContain("report-references");
  });

  it("defines required evaluation artifacts without result metrics", () => {
    expect(requiredArtifactsByStage.evaluation).toEqual([
      "config.normalized",
      "prompt-pack",
      "answers",
      "answer-signal-inputs",
      "warnings",
      "artifact-manifest"
    ]);
    expect(requiredArtifactsByStage.evaluation).not.toContain("metrics");
    expect(requiredArtifactsByStage.evaluation).not.toContain("scan-result");
  });

  it("defines structure-trust-inputs as an artifact type", () => {
    expect(artifactTypeDefinitions["structure-trust-inputs"].description).toContain(
      "Machine-readable Trust"
    );
  });

  it("defines answer-signal-inputs as an artifact type", () => {
    expect(artifactTypeDefinitions["answer-signal-inputs"].description).toContain("answer");
  });

  it("defines measurement-inputs as an artifact type and stage", () => {
    expect(artifactTypeDefinitions["measurement-inputs"].description).toContain("measurement");
    expect(requiredArtifactsByStage["measurement-inputs"]).toEqual([
      "measurement-inputs",
      "warnings",
      "artifact-manifest"
    ]);
    expect(requiredArtifactsByStage["measurement-inputs"]).not.toContain("metrics");
    expect(requiredArtifactsByStage["measurement-inputs"]).not.toContain("scan-result");
  });

  it("defines metrics-draft as an artifact type and stage", () => {
    expect(artifactTypeDefinitions["metrics-draft"].description).toContain("draft metrics");
    expect(requiredArtifactsByStage["metrics-draft"]).toEqual([
      "metrics-draft",
      "warnings",
      "artifact-manifest"
    ]);
    expect(requiredArtifactsByStage["metrics-draft"]).not.toContain("metrics");
    expect(requiredArtifactsByStage["metrics-draft"]).not.toContain("scan-result");
    expect(requiredArtifactsByStage["metrics-draft"]).not.toContain("report");
    expect(requiredArtifactsByStage["metrics-draft"]).not.toContain("citations");
  });

  it("defines metrics-review as an artifact type and stage", () => {
    expect(artifactTypeDefinitions["metrics-review"].description).toContain("Review gate");
    expect(requiredArtifactsByStage["metrics-review"]).toEqual([
      "metrics-review",
      "warnings",
      "artifact-manifest"
    ]);
    expect(requiredArtifactsByStage["metrics-review"]).not.toContain("metrics");
    expect(requiredArtifactsByStage["metrics-review"]).not.toContain("scan-result");
    expect(requiredArtifactsByStage["metrics-review"]).not.toContain("report");
    expect(requiredArtifactsByStage["metrics-review"]).not.toContain("citations");
  });

  it("defines metrics-finalization as an artifact type and stage", () => {
    expect(artifactTypeDefinitions["metrics-finalization"].description).toContain(
      "Finalization guard"
    );
    expect(requiredArtifactsByStage["metrics-finalization"]).toEqual([
      "metrics-finalization",
      "warnings",
      "artifact-manifest"
    ]);
    expect(requiredArtifactsByStage["metrics-finalization"]).not.toContain("metrics");
    expect(requiredArtifactsByStage["metrics-finalization"]).not.toContain("scan-result");
    expect(requiredArtifactsByStage["metrics-finalization"]).not.toContain("report");
    expect(requiredArtifactsByStage["metrics-finalization"]).not.toContain("citations");
  });
});

function validManifest(): OpenVisiArtifactManifest {
  return {
    schemaVersion: "0.1",
    project: "OpenVisi",
    generatedAt: "2026-05-26T00:00:00.000Z",
    stage: "dry-run",
    artifacts: [
      {
        id: "scan-plan",
        type: "scan-plan",
        path: "scan-plan.json",
        description: "Dry-run scan plan.",
        generated: true,
        requiredFor: ["scan"],
        stage: "stage-1c"
      },
      {
        id: "prompt-pack",
        type: "prompt-pack",
        path: "prompt-pack.json",
        description: "Prompt pack.",
        generated: true,
        requiredFor: ["scan"],
        stage: "stage-1c"
      },
      {
        id: "config.normalized",
        type: "config",
        path: "config.normalized.json",
        description: "Normalized config.",
        generated: true,
        requiredFor: ["scan"],
        stage: "stage-1c"
      },
      {
        id: "warnings",
        type: "warnings",
        path: "warnings.json",
        description: "Warnings.",
        generated: true,
        requiredFor: ["scan"],
        stage: "stage-1c"
      },
      {
        id: "artifact-manifest",
        type: "unknown",
        path: "artifact-manifest.json",
        description: "Manifest.",
        generated: true,
        requiredFor: ["scan"],
        stage: "stage-2c"
      }
    ],
    warnings: []
  };
}

function validReportReferences(): ReportReferencesFile {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-05-26T00:00:00.000Z",
    references: [
      {
        section: "AI-readable Structure",
        artifactId: "crawled-pages",
        path: "crawled-pages.json",
        description: "Canonical crawled pages."
      }
    ]
  };
}
