import type {
  BenchmarkMode,
  ModelConfig,
  Prompt,
  RawResponse,
  RunConfig,
  Target
} from "./schemas.js";
import { createOpenAIResponsesProvider } from "@openvisi/providers";
import { readEnvValue } from "./env.js";

export interface ProviderProbeInput {
  prompt: Prompt;
  target: Target;
  mode: BenchmarkMode;
  model: ModelConfig;
  sampleIndex: number;
  runConfig: RunConfig;
  cwd: string;
}

export interface ProviderAdapter {
  provider: string;
  probe(input: ProviderProbeInput): Promise<RawResponse>;
}

export function createProviderAdapter(provider: string): ProviderAdapter {
  const normalized = provider.toLowerCase();

  if (normalized === "mock") {
    return createMockProvider();
  }

  if (normalized === "openai") {
    return createOpenAIProvider();
  }

  if (normalized === "anthropic") {
    return createPlaceholderProvider("anthropic", "ANTHROPIC_API_KEY");
  }

  if (normalized === "gemini" || normalized === "google") {
    return createPlaceholderProvider(provider, "GEMINI_API_KEY");
  }

  throw new Error(`Unsupported benchmark provider "${provider}". Use "mock" for v0.1 local runs.`);
}

function createOpenAIProvider(): ProviderAdapter {
  return {
    provider: "openai",
    async probe(input) {
      const provider = createOpenAIResponsesProvider({ cwd: input.cwd });
      const response = await provider.probe({
        promptId: input.prompt.id,
        promptText: input.prompt.text,
        promptLayer: input.prompt.layer,
        targetId: input.target.id,
        targetName: input.target.name,
        targetCategory: input.target.category,
        competitorGroup: input.target.competitorGroup,
        officialDomains: input.target.officialDomains,
        intentBuyer: input.prompt.intentBuyer,
        mode: input.mode,
        modelId: input.model.modelId,
        sampleIndex: input.sampleIndex
      });

      return {
        promptId: input.prompt.id,
        targetId: input.target.id,
        provider: input.model.provider,
        model: response.model,
        mode: input.mode,
        sampleIndex: input.sampleIndex,
        timestamp: response.timestamp,
        text: response.text,
        citations: response.citations,
        ...(response.usage ? { usage: response.usage } : {}),
        rawProviderPayload: response.rawProviderPayload
      };
    }
  };
}

function createMockProvider(): ProviderAdapter {
  return {
    provider: "mock",
    async probe(input) {
      const citationDomain = input.target.officialDomains[0] ?? "example.com";
      const citations =
        input.mode === "grounded"
          ? [
              {
                url: `https://${citationDomain}/`,
                title: `${input.target.name} official source`,
                domain: citationDomain
              }
            ]
          : [];
      const text = createMockText(input);
      const inputTokens = estimateTokens(
        `${input.prompt.text} ${input.target.name} ${input.target.category}`
      );
      const outputTokens = estimateTokens(text);

      return {
        promptId: input.prompt.id,
        targetId: input.target.id,
        provider: input.model.provider,
        model: input.model.modelId,
        mode: input.mode,
        sampleIndex: input.sampleIndex,
        timestamp: new Date().toISOString(),
        text,
        citations,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens
        },
        rawProviderPayload: {
          deterministic: true,
          provider: "mock",
          benchmarkHarness: "0.1"
        }
      };
    }
  };
}

function createPlaceholderProvider(provider: string, apiKeyName: string): ProviderAdapter {
  return {
    provider,
    async probe(input) {
      const apiKey = await readEnvValue(apiKeyName, input.cwd);
      if (!apiKey) {
        throw new Error(
          `Missing ${apiKeyName} for provider "${provider}". Add it to .env or use provider "mock".`
        );
      }

      throw new Error(
        `${provider} adapter placeholder is not implemented in Benchmark Harness v0.1. TODO: add real provider integration behind explicit benchmark execution.`
      );
    }
  };
}

function createMockText(input: ProviderProbeInput): string {
  const modeClause =
    input.mode === "grounded"
      ? "with official source evidence"
      : "from parametric model memory without live source evidence";

  return [
    `${input.target.name} is evaluated for ${input.target.category} ${modeClause}.`,
    `Prompt layer: ${input.prompt.layer}. Buyer intent: ${input.prompt.intentBuyer}.`,
    `${input.target.name} appears as a relevant vendor in the ${input.target.competitorGroup} competitor group.`,
    `This deterministic mock answer exists for benchmark plumbing only and is not real LLM evidence.`
  ].join(" ");
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.3));
}
