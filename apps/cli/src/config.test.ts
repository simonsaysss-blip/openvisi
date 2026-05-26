import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadOpenVisiConfig, materializeScanConfig } from "./config.js";
import type { OpenVisiConfigInput } from "./config.js";

describe("OpenVisi CLI config", () => {
  it("loads JSON config files", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "openvisi-config-"));
    const configPath = path.join(directory, "openvisi.config.json");
    await writeFile(configPath, `${JSON.stringify(configInput(), null, 2)}\n`, "utf8");

    await expect(loadOpenVisiConfig(configPath)).resolves.toMatchObject({
      brandName: "OpenVisi",
      domain: "openvisi.dev"
    });
  });

  it("generates a default prompt pack when missing", () => {
    const config = materializeScanConfig(configInput());

    expect(config.promptPack.length).toBeGreaterThanOrEqual(12);
    expect(JSON.stringify(config.promptPack)).not.toContain("undefined");
  });

  it("respects a provided prompt pack", () => {
    const config = materializeScanConfig({
      ...configInput(),
      promptPack: [
        {
          id: "provided-prompt",
          text: "What does OpenVisi do?",
          intent: "brand_specific",
          category: "AI Visibility diagnostics"
        }
      ]
    });

    expect(config.promptPack).toHaveLength(1);
    expect(config.promptPack[0]?.id).toBe("provided-prompt");
  });

  it("applies provider and output overrides", () => {
    const config = materializeScanConfig(configInput(), {
      provider: "mock-alt",
      outputDir: "custom-report"
    });

    expect(config.providers).toEqual([{ provider: "mock-alt", enabled: true }]);
    expect(config.outputDir).toBe("custom-report");
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
