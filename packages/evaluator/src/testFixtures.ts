import type { OpenVisiScanConfig, PromptIntent, PromptSpec } from "@openvisi/core";

export function prompt(id: string, intent: PromptIntent = "brand_specific"): PromptSpec {
  return {
    id,
    text: "What does OpenVisi do?",
    intent,
    category: "AI Visibility diagnostics",
    expectedEntities: ["OpenVisi"],
    targetEntity: "OpenVisi"
  };
}

export function scanConfig(): OpenVisiScanConfig {
  return {
    brandName: "OpenVisi",
    domain: "openvisi.dev",
    category: "AI Visibility diagnostics",
    competitors: [{ name: "Example Competitor", domain: "example.com" }],
    promptPack: [
      prompt("category-discovery-001", "category_discovery"),
      prompt("brand-specific-001", "brand_specific"),
      prompt("buyer-intent-001", "buyer_intent")
    ],
    providers: [{ provider: "mock", model: "mock-v0", enabled: true }],
    outputDir: "openvisi-report",
    includeExperimentalMetrics: false
  };
}
