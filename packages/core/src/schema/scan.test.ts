import { describe, expect, it } from "vitest";
import type { OpenVisiScanConfig } from "./scan.js";
import { validateScanConfig } from "./scan.js";

describe("validateScanConfig", () => {
  it("returns no errors for a valid config", () => {
    expect(validateScanConfig(validConfig())).toEqual([]);
  });

  it("detects missing brandName, domain, and category", () => {
    expect(
      validateScanConfig({
        ...validConfig(),
        brandName: "",
        domain: "",
        category: ""
      })
    ).toEqual([
      "brandName is required.",
      "domain is required.",
      "category is required."
    ]);
  });

  it("detects duplicate prompt IDs", () => {
    expect(
      validateScanConfig({
        ...validConfig(),
        promptPack: [
          {
            id: "duplicate",
            text: "What does OpenVisi do?",
            intent: "brand_specific",
            category: "AI Visibility"
          },
          {
            id: "duplicate",
            text: "What are alternatives to OpenVisi?",
            intent: "alternative_comparison",
            category: "AI Visibility"
          }
        ]
      })
    ).toContain("Duplicate prompt id: duplicate");
  });
});

function validConfig(): OpenVisiScanConfig {
  return {
    brandName: "OpenVisi",
    domain: "openvisi.dev",
    category: "AI Visibility diagnostics",
    competitors: [
      {
        name: "Example Visibility Tool",
        domain: "example.com"
      }
    ],
    promptPack: [
      {
        id: "brand-specific-openvisi",
        text: "What does OpenVisi do?",
        intent: "brand_specific",
        category: "AI Visibility diagnostics",
        targetEntity: "OpenVisi",
        expectedEntities: ["OpenVisi"]
      }
    ],
    providers: [
      {
        provider: "local-fixture",
        enabled: true
      }
    ],
    outputDir: "reports",
    includeExperimentalMetrics: false
  };
}
