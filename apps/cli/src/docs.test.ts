import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateScanConfig } from "@openvisi/core";
import { materializeScanConfig, type OpenVisiConfigInput } from "./config.js";

describe("OSS documentation examples", () => {
  it("README contains the canonical AI Visibility definition and avoids AI SEO positioning", async () => {
    const readme = await readText("README.md");

    expect(readme).toContain("OpenVisi defines an open-source measurement layer for AI Visibility.");
    expect(readme).toContain(
      "AI Visibility is the measurable presence, accuracy, citation quality, and competitive position of an entity across AI-generated answers."
    );
    expect(readme).not.toMatch(/OpenVisi is an AI SEO/i);
    expect(readme).not.toMatch(/rank higher in/i);
  });

  it("example config is valid JSON and materializes into a valid scan config", async () => {
    const raw = await readText("examples/openvisi.config.example.json");
    const config = JSON.parse(raw) as OpenVisiConfigInput;
    const materialized = materializeScanConfig(config);

    expect(raw).not.toMatch(/api[_-]?key/i);
    expect(raw).not.toMatch(/secret/i);
    expect(materialized.providers.map((provider) => provider.provider)).toEqual(["mock"]);
    expect(validateScanConfig(materialized)).toEqual([]);
  });

  it("debug report example preserves final-score disclaimers", async () => {
    const example = await readText("examples/debug-report.example.md");

    expect(example).toContain("not a final AI Visibility report");
    expect(example).toContain("No final AI Visibility Score");
    expect(example).toContain("Mock evaluator evidence");
    expect(example).toContain("allowedToGenerateMetricsJson: false");
  });

  it("documents and wires the local mock demo verifier", async () => {
    const packageJson = JSON.parse(await readText("package.json")) as {
      scripts: Record<string, string>;
    };
    const readme = await readText("README.md");
    const demoVerification = await readText("docs/demo-verification.md");
    const gitignore = await readText(".gitignore");

    expect(packageJson.scripts["demo:mock"]).toBe("node scripts/run-mock-demo.mjs");
    expect(packageJson.scripts["demo:mock:clean"]).toBe(
      "node scripts/run-mock-demo.mjs --clean"
    );
    expect(readme).toContain("npm run demo:mock");
    expect(demoVerification).toContain("No external network access is required.");
    expect(demoVerification).toContain("No API keys are required.");
    expect(gitignore).toContain(".openvisi-demo/");
  });

  it("documents OSS readiness files and GitHub workflow guardrails", async () => {
    const readme = await readText("README.md");
    const contributing = await readText("CONTRIBUTING.md");
    const pullRequestTemplate = await readText(".github/PULL_REQUEST_TEMPLATE.md");
    const ciWorkflow = await readText(".github/workflows/ci.yml");
    const demoWorkflow = await readText(".github/workflows/demo-mock.yml");

    expect(readme).toContain("[Contributing Guide](CONTRIBUTING.md)");
    expect(readme).toContain("[Roadmap](ROADMAP.md)");
    expect(readme).toContain("[Architecture](ARCHITECTURE.md)");
    expect(readme).toContain("[Security Policy](SECURITY.md)");
    expect(contributing).toContain("Do not treat mock evaluator evidence as real LLM evidence.");
    expect(pullRequestTemplate).toContain("Does this generate `metrics.json`?");
    expect(ciWorkflow).not.toContain("demo:mock");
    expect(demoWorkflow).toContain("workflow_dispatch");
    expect(demoWorkflow).toContain("npm run demo:mock");
  });

  it("documents release candidate hygiene and wires release checks", async () => {
    const packageJson = JSON.parse(await readText("package.json")) as {
      scripts: Record<string, string>;
    };
    const readme = await readText("README.md");
    const changelog = await readText("CHANGELOG.md");
    const releaseChecklist = await readText("docs/release-checklist.md");
    const versioning = await readText("docs/versioning.md");
    const releaseNotes = await readText("docs/release-notes/v0.1.0.md");
    const releaseWorkflow = await readText(".github/workflows/release-check.yml");

    expect(packageJson.scripts["check:docs"]).toBe("node scripts/check-doc-links.mjs");
    expect(packageJson.scripts["check:metadata"]).toBe(
      "node scripts/check-package-metadata.mjs"
    );
    expect(packageJson.scripts["check:release-artifacts"]).toBe(
      "node scripts/check-release-artifacts.mjs"
    );
    expect(packageJson.scripts["release:check"]).toContain("npm run check:docs");
    expect(packageJson.scripts["release:check"]).toContain("npm pack --dry-run");
    expect(packageJson.scripts["release:check"]).not.toContain("demo:mock");

    expect(readme).toContain("[Changelog](CHANGELOG.md)");
    expect(readme).toContain("[Release Checklist](docs/release-checklist.md)");
    expect(changelog).toContain("## [0.1.0] - Draft");
    expect(changelog).toContain("No final AI Visibility Score is computed yet.");
    expect(releaseChecklist).toContain("npm pack --dry-run");
    expect(versioning).toContain("`schemaVersion` update");
    expect(releaseNotes).toContain("No final AI Visibility Score.");
    expect(releaseWorkflow).toContain("workflow_dispatch");
    expect(releaseWorkflow).toContain("npm run release:check");
  });

  it("documents release rehearsal without publish, tags, providers, or final scoring", async () => {
    const packageJson = JSON.parse(await readText("package.json")) as {
      scripts: Record<string, string>;
    };
    const readme = await readText("README.md");
    const releaseChecklist = await readText("docs/release-checklist.md");
    const releaseRehearsal = await readText("docs/release-rehearsal.md");
    const rcChecklist = await readText("docs/release-notes/v0.1.0-rc-checklist.md");
    const gitignore = await readText(".gitignore");

    expect(packageJson.scripts["release:rehearse"]).toBe("node scripts/rehearse-release.mjs");
    expect(packageJson.scripts["release:rehearse:clean"]).toBe(
      "node scripts/rehearse-release.mjs --clean"
    );
    expect(readme).toContain("[Release Rehearsal](docs/release-rehearsal.md)");
    expect(releaseChecklist).toContain("npm run release:rehearse");
    expect(rcChecklist).toContain("No `npm publish` has been run yet.");
    expect(gitignore).toContain(".openvisi-release/");
    expect(releaseRehearsal).toContain("It does not run `npm publish`.");
    expect(releaseRehearsal).toContain("It does not create a git tag.");
    expect(releaseRehearsal).toContain("It does not call OpenAI");
    expect(releaseRehearsal).toContain("It does not compute a final AI Visibility Score.");
  });

  it("documents RC freeze review and release decision guardrails", async () => {
    const packageJson = JSON.parse(await readText("package.json")) as {
      scripts: Record<string, string>;
    };
    const readme = await readText("README.md");
    const changelog = await readText("CHANGELOG.md");
    const releaseChecklist = await readText("docs/release-checklist.md");
    const freezeReview = await readText("docs/release-notes/v0.1.0-rc-freeze-review.md");
    const knownLimitations = await readText("docs/release-notes/v0.1.0-known-limitations.md");
    const publishPlan = await readText("docs/release-notes/v0.1.0-publish-plan.md");

    expect(packageJson.scripts["release:rc-check"]).toBe(
      "node scripts/rc-freeze-check.mjs"
    );
    expect(readme).toContain("[v0.1.0 RC Freeze Review]");
    expect(releaseChecklist).toContain("npm run release:rc-check");
    expect(freezeReview).toContain("v0.1.0 RC: ready after manual review");
    expect(knownLimitations).toContain("No final AI Visibility Score.");
    expect(knownLimitations).toContain("No final `metrics.json`.");
    expect(publishPlan).toContain("This document describes the manual release plan");
    expect(publishPlan).toContain("No automatic `npm publish`.");
    expect(changelog).toContain("No `metrics.json` is generated yet.");
  });
});

async function readText(relativePath: string): Promise<string> {
  return readFile(path.resolve(process.cwd(), relativePath), "utf8");
}
