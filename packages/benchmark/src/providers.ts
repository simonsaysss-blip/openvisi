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
      const response = await callOpenAIResponses({ input, apiKey });
      const text = extractOpenAIText(response);
      const usage = extractOpenAIUsage(response);
      const model = typeof response.model === "string" ? response.model : input.model.modelId;
      const citations = extractOpenAICitations(response, text);
      const webSearchCalls = extractOpenAIWebSearchCalls(response);

      return {
        promptId: input.prompt.id,
        targetId: input.target.id,
        provider: input.model.provider,
        model,
        mode: input.mode,
        sampleIndex: input.sampleIndex,
        timestamp,
        text,
        citations,
        ...(usage ? { usage } : {}),
        rawProviderPayload: {
          provider: "openai",
          endpoint: "responses",
          id: typeof response.id === "string" ? response.id : undefined,
          model,
          createdAt: typeof response.created_at === "number" ? response.created_at : undefined,
          status: response.status,
          usage: response.usage,
          groundedSearch: input.mode === "grounded",
          toolChoice: input.mode === "grounded" ? "required" : "none",
          webSearchCalls,
          citations,
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

interface OpenAIResponseCitation {
  url?: string;
  title?: string;
  domain?: string;
}

interface OpenAIResponsesResponse {
  id?: string;
  model?: string;
  created_at?: number;
  status?: string;
  output_text?: string;
  output?: Array<{
    id?: string;
    type?: string;
    status?: string;
    action?: {
      type?: string;
      query?: string;
      queries?: string[];
      sources?: Array<{
        url?: string;
        title?: string;
      }>;
    };
    content?: Array<{
      type?: string;
      text?: string;
      annotations?: Array<{
        type?: string;
        url?: string;
        title?: string;
        start_index?: number;
        end_index?: number;
      }>;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

async function callOpenAIResponses(input: {
  input: ProviderProbeInput;
  apiKey: string;
}): Promise<OpenAIResponsesResponse> {
  const grounded = input.input.mode === "grounded";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model: input.input.model.modelId,
      input: [
        {
          role: "system",
          content: createOpenAISystemPrompt(input.input.mode)
        },
        {
          role: "user",
          content: createOpenAIUserPrompt(input.input)
        }
      ],
      max_output_tokens: 700,
      ...(grounded
        ? {
            tools: [{ type: "web_search", search_context_size: "low" }],
            tool_choice: "required"
          }
        : {})
    })
  });
  const parsed = (await response.json().catch(() => ({}))) as OpenAIResponsesResponse;

  if (!response.ok) {
    const providerMessage = parsed.error?.message ?? response.statusText;
    throw new Error(`OpenAI provider error (${response.status}): ${providerMessage}`);
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

function extractOpenAIText(response: OpenAIResponsesResponse): string {
  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractOpenAIUsage(response: OpenAIResponsesResponse):
  | {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    }
  | undefined {
  const usage = response.usage;
  if (!usage) return undefined;

  return {
    ...(typeof usage.input_tokens === "number" ? { inputTokens: usage.input_tokens } : {}),
    ...(typeof usage.output_tokens === "number"
      ? { outputTokens: usage.output_tokens }
      : {}),
    ...(typeof usage.total_tokens === "number" ? { totalTokens: usage.total_tokens } : {})
  };
}

function extractOpenAICitations(
  response: OpenAIResponsesResponse,
  text: string
): OpenAIResponseCitation[] {
  const citations: OpenAIResponseCitation[] = [];

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      for (const annotation of content.annotations ?? []) {
        if (annotation.type === "url_citation" && annotation.url) {
          citations.push(createCitation(annotation.url, annotation.title));
        }
      }
    }

    for (const source of item.action?.sources ?? []) {
      if (source.url) {
        citations.push(createCitation(source.url, source.title));
      }
    }
  }

  citations.push(...extractCitationsFromText(text));

  return dedupeCitations(citations);
}

function extractOpenAIWebSearchCalls(response: OpenAIResponsesResponse) {
  return (response.output ?? [])
    .filter((item) => item.type === "web_search_call")
    .map((item) => ({
      id: item.id,
      status: item.status,
      actionType: item.action?.type,
      query: item.action?.query,
      queries: item.action?.queries,
      sources: (item.action?.sources ?? []).map((source) =>
        source.url ? createCitation(source.url, source.title) : { title: source.title }
      )
    }));
}

function extractCitationsFromText(text: string): OpenAIResponseCitation[] {
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

function createCitation(url: string, title?: string): OpenAIResponseCitation {
  const domain = extractDomain(url);
  return {
    url,
    ...(title ? { title } : {}),
    ...(domain ? { domain } : {})
  };
}

function dedupeCitations(citations: OpenAIResponseCitation[]): OpenAIResponseCitation[] {
  const byKey = new Map<string, OpenAIResponseCitation>();

  for (const citation of citations) {
    const key = citation.url ?? citation.domain ?? citation.title;
    if (!key || byKey.has(key)) continue;
    byKey.set(key, citation);
  }

  return [...byKey.values()];
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
