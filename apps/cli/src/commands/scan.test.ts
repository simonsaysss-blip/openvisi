import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runDryRunScan } from "./scan.js";
import type { OpenVisiConfigInput } from "../config.js";

describe("runDryRunScan", () => {
  it("writes dry-run artifacts without fake result data", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-dry-run-"));
    const configPath = path.join(directory, "openvisi.config.json");
    const outputDir = path.join(directory, "openvisi-report");
    await writeFile(configPath, `${JSON.stringify(configInput(), null, 2)}\n`, "utf8");
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, "crawled-pages.json"), "[]\n", "utf8");
    await writeFile(path.join(outputDir, "report-references.json"), "{}\n", "utf8");

    await runDryRunScan({
      config: configPath,
      output: outputDir,
      provider: "mock",
      includeExperimentalMetrics: true
    });

    const scanPlan = JSON.parse(await readFile(path.join(outputDir, "scan-plan.json"), "utf8")) as {
      promptCount: number;
      includeExperimentalMetrics: boolean;
    };
    const promptPack = JSON.parse(
      await readFile(path.join(outputDir, "prompt-pack.json"), "utf8")
    ) as unknown[];
    const normalizedConfig = JSON.parse(
      await readFile(path.join(outputDir, "config.normalized.json"), "utf8")
    ) as { providers: Array<{ provider: string; enabled: boolean }> };
    const warnings = JSON.parse(await readFile(path.join(outputDir, "warnings.json"), "utf8")) as string[];
    const manifest = JSON.parse(
      await readFile(path.join(outputDir, "artifact-manifest.json"), "utf8")
    ) as { artifacts: Array<{ path: string }> };

    expect(scanPlan.promptCount).toBe(promptPack.length);
    expect(scanPlan.includeExperimentalMetrics).toBe(true);
    expect(normalizedConfig.providers).toEqual([{ provider: "mock", enabled: true }]);
    expect(warnings).toContain("Dry-run mode does not crawl pages.");
    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual([
      "scan-plan.json",
      "prompt-pack.json",
      "config.normalized.json",
      "warnings.json",
      "artifact-manifest.json"
    ]);
    await expect(fileExists(path.join(outputDir, "scan-result.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "answers.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "answer-signal-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "measurement-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-draft.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-review.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics-finalization.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "metrics.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "answers.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "citations.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "crawled-pages.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "structure-trust-inputs.json"))).resolves.toBe(false);
    await expect(fileExists(path.join(outputDir, "report-references.json"))).resolves.toBe(false);
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
    promptPackInput: {
      audience: "B2B SaaS teams",
      problems: ["measuring AI-generated answer visibility"],
      integrations: ["Slack"]
    }
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
