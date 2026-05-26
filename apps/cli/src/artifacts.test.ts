import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createArtifactManifest,
  createCrawlReportReferences,
  getExistingArtifacts
} from "./artifacts.js";

describe("OpenVisi artifact helpers", () => {
  it("includes only files that exist", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-artifacts-"));
    await writeFile(path.join(directory, "scan-plan.json"), "{}\n", "utf8");
    await writeFile(path.join(directory, "warnings.json"), "[]\n", "utf8");

    const artifacts = await getExistingArtifacts(directory);

    expect(artifacts.map((artifact) => artifact.path)).toEqual([
      "scan-plan.json",
      "warnings.json"
    ]);
  });

  it("creates stage-specific manifests without future result artifacts", () => {
    const dryRunManifest = createArtifactManifest({
      generatedAt: "2026-05-26T00:00:00.000Z",
      stage: "dry-run",
      artifacts: [
        {
          id: "scan-plan",
          type: "scan-plan",
          path: "scan-plan.json",
          description: "Scan plan.",
          generated: true,
          requiredFor: ["scan"],
          stage: "stage-1c"
        }
      ]
    });

    expect(dryRunManifest.artifacts.map((artifact) => artifact.path)).not.toContain(
      "crawled-pages.json"
    );
    expect(dryRunManifest.artifacts.map((artifact) => artifact.path)).not.toContain(
      "metrics.json"
    );
    expect(dryRunManifest.artifacts.map((artifact) => artifact.path)).not.toContain(
      "answers.json"
    );
    expect(dryRunManifest.artifacts.map((artifact) => artifact.path)).not.toContain(
      "citations.json"
    );
    expect(dryRunManifest.artifacts.map((artifact) => artifact.path)).not.toContain(
      "scan-result.json"
    );
  });

  it("creates crawl report references for required future report sections", () => {
    const references = createCrawlReportReferences({
      generatedAt: "2026-05-26T00:00:00.000Z"
    });

    expect(references.references.map((reference) => reference.section)).toEqual([
      "AI-readable Structure",
      "Machine-readable Trust",
      "AI Citation Signals",
      "Source Gaps",
      "Raw Crawled Pages",
      "Crawler Summary"
    ]);
    expect(references.references[0]?.path).toBe("structure-trust-inputs.json");
    expect(references.references.every((reference) => !path.isAbsolute(reference.path))).toBe(true);
  });
});
