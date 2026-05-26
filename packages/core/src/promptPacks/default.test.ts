import { describe, expect, it } from "vitest";
import { createDefaultPromptPack } from "./default.js";
import type { PromptPackInput } from "./types.js";

describe("createDefaultPromptPack", () => {
  it("is deterministic", () => {
    expect(createDefaultPromptPack(input())).toEqual(createDefaultPromptPack(input()));
  });

  it("returns all required intent categories when enough input exists", () => {
    const intents = new Set(createDefaultPromptPack(input()).map((prompt) => prompt.intent));

    expect(intents).toEqual(
      new Set([
        "category_discovery",
        "alternative_comparison",
        "problem_solution",
        "brand_specific",
        "integration",
        "buyer_intent"
      ])
    );
  });

  it("generates unique readable IDs without undefined placeholders", () => {
    const prompts = createDefaultPromptPack(input());
    const ids = prompts.map((prompt) => prompt.id);

    expect(prompts.length).toBeGreaterThanOrEqual(12);
    expect(prompts.length).toBeLessThanOrEqual(20);
    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify(prompts)).not.toContain("undefined");
  });
});

function input(): PromptPackInput {
  return {
    brandName: "OpenVisi",
    category: "AI Visibility diagnostics",
    domain: "openvisi.dev",
    audience: "open-source maintainers",
    competitors: [
      {
        name: "Example Visibility Platform",
        domain: "example.com"
      },
      {
        name: "Search Insights Tool",
        aliases: ["SIT"]
      }
    ],
    problems: ["improving citation coverage", "measuring answer presence"],
    integrations: ["GitHub Actions", "Markdown documentation"]
  };
}
