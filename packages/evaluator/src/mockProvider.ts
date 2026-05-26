import type { GenerateAnswerInput, GenerateAnswerOptions, LLMProviderAdapter } from "@openvisi/core";

const defaultModel = "mock-v0";

export function createMockProvider(): LLMProviderAdapter {
  return {
    name: "mock",
    async generateAnswer(input: GenerateAnswerInput, options?: GenerateAnswerOptions) {
      const model = options?.model ?? defaultModel;
      const competitors = input.competitors?.length
        ? ` Compared entities: ${input.competitors.join(", ")}.`
        : "";

      return {
        promptId: input.prompt.id,
        provider: "mock",
        model,
        answerText:
          `[mock output] ${input.brandName} is represented as a ${input.category} entity for ` +
          `the ${input.prompt.intent} prompt intent.${competitors} This deterministic response ` +
          "exists only to exercise OpenVisi evaluator contracts.",
        citations: [],
        raw: {
          mock: true,
          promptId: input.prompt.id,
          provider: "mock",
          model
        },
        createdAt: deterministicCreatedAt(input.prompt.id)
      };
    }
  };
}

function deterministicCreatedAt(promptId: string): string {
  const minute = stableHash(promptId) % 60;
  return `2026-01-01T00:${String(minute).padStart(2, "0")}:00.000Z`;
}

function stableHash(value: string): number {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100000;
  }
  return hash;
}
