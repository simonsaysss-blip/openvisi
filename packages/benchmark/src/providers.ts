import type {
  BenchmarkMode,
  ModelConfig,
  Prompt,
  RawResponse,
  RunConfig,
  Target
} from "./schemas.js";
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
      const apiKey = await readEnvValue("OPENAI_API_KEY", input.cwd);
      if (!apiKey) {
        throw new Error(
          'Provider configuration error: Missing OPENAI_API_KEY for provider "openai". Add it to .env or use provider "mock".'
        );
      }

      const timestamp = new Date().toISOString();
      const response = await callOpenAIChatCompletions({ input, apiKey });
      const text = extractOpenAIText(response);
      const usage = extractOpenAIUsage(response);
      const model = typeof response.model === "string" ? response.model : input.model.modelId;

      return {
        promptId: input.prompt.id,
        targetId: input.target.id,
        provider: input.model.provider,
        model,
        mode: input.mode,
        sampleIndex: input.sampleIndex,
        timestamp,
        text,
        citations: extractCitationsFromText(text),
        ...(usage ? { usage } : {}),
        rawProviderPayload: {
          provider: "openai",
          endpoint: "chat.completions",
          id: typeof response.id === "string" ? response.id : undefined,
          model,
          created: typeof response.created === "number" ? response.created : undefined,
          usage: response.usage,
          finishReason: response.choices?.[0]?.finish_reason,
          promptId: input.prompt.id,
          targetId: input.target.id,
          mode: input.mode,
          sampleIndex: input.sampleIndex
        }
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

interface OpenAIChatCompletionResponse {
  id?: string;
  model?: string;
  created?: number;
  choices?: Array<{
    message?: {
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

async function callOpenAIChatCompletions(input: {
  input: ProviderProbeInput;
  apiKey: string;
}): Promise<OpenAIChatCompletionResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.input.model.modelId,
      messages: [
        {
          role: "system",
          content: createOpenAISystemPrompt(input.input.mode)
        },
        {
          role: "user",
          content: createOpenAIUserPrompt(input.input)
        }
      ],
      temperature: 0.2,
      max_tokens: 700
    })
  });
  const parsed = (await response.json().catch(() => ({}))) as OpenAIChatCompletionResponse;

  if (!response.ok) {
    const providerMessage = parsed.error?.message ?? response.statusText;
    throw new Error(
      `OpenAI provider error (${response.status}): ${providerMessage}`
    );
  }

  return parsed;
}

function createOpenAISystemPrompt(mode: BenchmarkMode): string {
  const sourceInstruction =
    mode === "grounded"
      ? "When you cite sources, include plain official source URLs only if you are confident. Do not invent citations."
      : "Answer from model knowledge only. Do not browse and do not invent citations.";

  return [
    "You are participating in an auditable AI Visibility benchmark.",
    "Answer concisely for regulated pharma / QMS software evaluation.",
    sourceInstruction,
    "Do not mention benchmark internals unless directly relevant."
  ].join(" ");
}

function createOpenAIUserPrompt(input: ProviderProbeInput): string {
  return [
    `Target entity: ${input.target.name}`,
    `Target ID: ${input.target.id}`,
    `Category: ${input.target.category}`,
    `Competitor group: ${input.target.competitorGroup}`,
    `Official domains: ${input.target.officialDomains.join(", ")}`,
    `Benchmark mode: ${input.mode}`,
    `Prompt ID: ${input.prompt.id}`,
    `Prompt layer: ${input.prompt.layer}`,
    `Buyer intent: ${input.prompt.intentBuyer}`,
    "",
    input.prompt.text
  ].join("\n");
}

function extractOpenAIText(response: OpenAIChatCompletionResponse): string {
  return response.choices?.[0]?.message?.content ?? "";
}

function extractOpenAIUsage(response: OpenAIChatCompletionResponse):
  | {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    }
  | undefined {
  const usage = response.usage;
  if (!usage) return undefined;

  return {
    ...(typeof usage.prompt_tokens === "number" ? { inputTokens: usage.prompt_tokens } : {}),
    ...(typeof usage.completion_tokens === "number"
      ? { outputTokens: usage.completion_tokens }
      : {}),
    ...(typeof usage.total_tokens === "number" ? { totalTokens: usage.total_tokens } : {})
  };
}

function extractCitationsFromText(text: string): Array<{ url?: string; title?: string; domain?: string }> {
  const urls = [...text.matchAll(/https?:\/\/[^\s)\]]+/g)].map((match) =>
    match[0].replace(/[.,;:]+$/, "")
  );
  const uniqueUrls = [...new Set(urls)];

  return uniqueUrls.map((url) => {
    const domain = extractDomain(url);
    return {
      url,
      ...(domain ? { domain } : {})
    };
  });
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return undefined;
  }
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
