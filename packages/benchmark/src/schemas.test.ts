import { describe, expect, it } from "vitest";
import {
  PromptSchema,
  RawResponseSchema,
  RunConfigSchema,
  TargetSchema,
  validateMetricResult
} from "./schemas.js";

describe("benchmark schemas", () => {
  it("accepts valid target, prompt, run config, raw response, and metric result shapes", () => {
    expect(
      TargetSchema.parse({
        id: "mastercontrol",
        name: "MasterControl",
        category: "Pharma QMS",
        competitorGroup: "pharma-qms",
        officialDomains: ["mastercontrol.com"]
      }).id
    ).toBe("mastercontrol");

    expect(
      PromptSchema.parse({
        id: "presence",
        text: "Which QMS vendors are considered for pharma?",
        layer: "Presence",
        category: "pharma-qms",
        intentBuyer: "quality leader"
      }).layer
    ).toBe("Presence");

    expect(
      RunConfigSchema.parse({
        models: [{ provider: "mock", modelId: "mock-qms-v0" }],
        modes: ["grounded", "parametric"],
        samplesPerCell: 1,
        dateLabel: "Pharma / QMS AI Visibility Benchmark 2026"
      }).samplesPerCell
    ).toBe(1);

    expect(
      RawResponseSchema.parse({
        promptId: "presence",
        targetId: "mastercontrol",
        provider: "mock",
        model: "mock-qms-v0",
        mode: "grounded",
        sampleIndex: 0,
        timestamp: "2026-01-01T00:00:00.000Z",
        text: "MasterControl is mentioned.",
        citations: [{ domain: "mastercontrol.com" }]
      }).text
    ).toContain("MasterControl");

    expect(
      validateMetricResult({
        targetId: "mastercontrol",
        provider: "mock",
        model: "mock-qms-v0",
        mode: "grounded",
        metric: "Mention Rate",
        value: 1,
        sampleCount: 1
      }).value
    ).toBe(1);
  });

  it("rejects invalid prompt layers", () => {
    expect(() =>
      PromptSchema.parse({
        id: "bad",
        text: "Bad layer",
        layer: "Ranking",
        category: "pharma-qms",
        intentBuyer: "quality leader"
      })
    ).toThrow();
  });
});
