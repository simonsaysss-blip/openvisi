import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { artifactTypeDefinitions } from "./artifacts.js";
import { validateAnswersArtifactShape } from "./evaluator.js";
import type { AnswersArtifact } from "./evaluator.js";

const fixturePath = path.resolve(
  process.cwd(),
  "test/fixtures/evaluator/mock-answers/answers.json"
);

describe("evaluator contracts", () => {
  it("accepts a valid answers artifact fixture", async () => {
    const artifact = JSON.parse(await readFile(fixturePath, "utf8")) as AnswersArtifact;

    expect(validateAnswersArtifactShape(artifact)).toEqual([]);
  });

  it("rejects missing required answers artifact fields", () => {
    expect(validateAnswersArtifactShape({})).toEqual(
      expect.arrayContaining([
        'schemaVersion must be "0.1".',
        "generatedAt must be an ISO date string.",
        "source must be an object.",
        "provider must be a known evaluator provider name.",
        "model must be a non-empty string.",
        "answers must be an array."
      ])
    );
  });

  it("rejects answers that are not arrays", () => {
    expect(validateAnswersArtifactShape({ ...validArtifact(), answers: {} })).toContain(
      "answers must be an array."
    );
  });

  it("rejects aiVisibilityScore because answers are not metrics", () => {
    expect(validateAnswersArtifactShape({ ...validArtifact(), aiVisibilityScore: 77 })).toContain(
      "answers artifact must not include aiVisibilityScore."
    );
  });

  it("documents answers as an artifact type", () => {
    expect(artifactTypeDefinitions.answers.description).toContain("LLM answer");
  });
});

function validArtifact(): AnswersArtifact {
  return {
    schemaVersion: "0.1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    source: {
      promptPack: "prompt-pack.json",
      config: "config.normalized.json"
    },
    provider: "mock",
    model: "mock-v0",
    answers: []
  };
}
