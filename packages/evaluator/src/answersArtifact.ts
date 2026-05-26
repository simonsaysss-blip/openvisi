import type { AnswersArtifact, EvaluatorProviderName, LLMAnswer } from "@openvisi/core";

export interface CreateAnswersArtifactInput {
  generatedAt?: string;
  provider: EvaluatorProviderName;
  model: string;
  answers: LLMAnswer[];
}

export function createAnswersArtifact(input: CreateAnswersArtifactInput): AnswersArtifact {
  return {
    schemaVersion: "0.1",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    source: {
      promptPack: "prompt-pack.json",
      config: "config.normalized.json"
    },
    provider: input.provider,
    model: input.model,
    answers: input.answers
  };
}
