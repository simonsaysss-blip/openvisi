import type { EvaluatorRunInput, EvaluatorRunResult } from "@openvisi/core";

export async function runEvaluator(input: EvaluatorRunInput): Promise<EvaluatorRunResult> {
  const competitors = input.config.competitors.map((competitor) => competitor.name);
  const answers = [];

  for (const prompt of input.config.promptPack) {
    answers.push(
      await input.provider.generateAnswer(
        {
          prompt,
          brandName: input.config.brandName,
          domain: input.config.domain,
          category: input.config.category,
          competitors
        },
        input.options
      )
    );
  }

  return {
    answers,
    warnings:
      input.provider.name === "mock"
        ? ["Mock evaluator output is deterministic and does not call real LLM providers."]
        : []
  };
}
