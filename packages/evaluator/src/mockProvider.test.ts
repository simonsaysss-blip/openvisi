import { describe, expect, it } from "vitest";
import { createMockProvider } from "./mockProvider.js";
import { prompt } from "./testFixtures.js";

describe("createMockProvider", () => {
  it("returns provider name mock", () => {
    expect(createMockProvider().name).toBe("mock");
  });

  it("returns deterministic output", async () => {
    const provider = createMockProvider();
    const input = {
      prompt: prompt("category-discovery-001"),
      brandName: "OpenVisi",
      domain: "openvisi.dev",
      category: "AI Visibility diagnostics",
      competitors: ["Example Competitor"]
    };

    await expect(provider.generateAnswer(input)).resolves.toEqual(await provider.generateAnswer(input));
  });

  it("includes brand name and category in answer text", async () => {
    const answer = await createMockProvider().generateAnswer({
      prompt: prompt("brand-specific-001"),
      brandName: "OpenVisi",
      domain: "openvisi.dev",
      category: "AI Visibility diagnostics"
    });

    expect(answer.answerText).toContain("OpenVisi");
    expect(answer.answerText).toContain("AI Visibility diagnostics");
  });

  it("returns citations as an array and raw.mock true", async () => {
    const answer = await createMockProvider().generateAnswer({
      prompt: prompt("buyer-intent-001"),
      brandName: "OpenVisi",
      domain: "openvisi.dev",
      category: "AI Visibility diagnostics"
    });

    expect(Array.isArray(answer.citations)).toBe(true);
    expect((answer.raw as { mock?: boolean }).mock).toBe(true);
  });
});
