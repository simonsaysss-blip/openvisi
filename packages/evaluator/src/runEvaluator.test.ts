import { describe, expect, it } from "vitest";
import { createMockProvider } from "./mockProvider.js";
import { runEvaluator } from "./runEvaluator.js";
import { scanConfig } from "./testFixtures.js";

describe("runEvaluator", () => {
  it("preserves prompt order and returns one answer per prompt", async () => {
    const config = scanConfig();

    const result = await runEvaluator({
      config,
      provider: createMockProvider(),
      options: { provider: "mock", model: "mock-v0" }
    });

    expect(result.answers.map((answer) => answer.promptId)).toEqual(
      config.promptPack.map((prompt) => prompt.id)
    );
    expect(result.answers).toHaveLength(config.promptPack.length);
  });

  it("does not compute metrics", async () => {
    const result = (await runEvaluator({
      config: scanConfig(),
      provider: createMockProvider()
    })) as unknown as Record<string, unknown>;

    expect(result.metrics).toBeUndefined();
    expect(result.aiVisibilityScore).toBeUndefined();
  });
});
