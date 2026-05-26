import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateAnswersArtifactShape } from "@openvisi/core";
import { createAnswersArtifact } from "./answersArtifact.js";
import { createMockProvider } from "./mockProvider.js";
import { prompt } from "./testFixtures.js";

describe("createAnswersArtifact", () => {
  it("creates a valid AnswersArtifact", async () => {
    const answer = await createMockProvider().generateAnswer({
      prompt: prompt("brand-specific-001"),
      brandName: "OpenVisi",
      domain: "openvisi.dev",
      category: "AI Visibility diagnostics"
    });

    const artifact = createAnswersArtifact({
      generatedAt: "2026-01-01T00:00:00.000Z",
      provider: "mock",
      model: "mock-v0",
      answers: [answer]
    });

    expect(validateAnswersArtifactShape(artifact)).toEqual([]);
    expect("metrics" in artifact).toBe(false);
  });

  it("validates the mock answers fixture", async () => {
    const artifact = JSON.parse(
      await readFile(
        path.resolve(process.cwd(), "test/fixtures/evaluator/mock-answers/answers.json"),
        "utf8"
      )
    ) as unknown;

    expect(validateAnswersArtifactShape(artifact)).toEqual([]);
  });
});
