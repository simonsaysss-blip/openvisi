import { readFile } from "node:fs/promises";
import path from "node:path";

export type OpenAIProviderMode = "grounded" | "parametric";

export interface OpenAIProviderProbeInput {
  promptId: string;
  promptText: string;
  promptLayer: string;
  targetId: string;
  targetName: string;
  targetCategory: string;
  competitorGroup: string;
  officialDomains: string[];
  intentBuyer: string;
  mode: OpenAIProviderMode;
  modelId: string;
  sampleIndex: number;
}

export interface OpenAIProviderCitation {
  url?: string;
  title?: string;
  domain?: string;
}

export interface OpenAIProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface EvidenceGateCheck {
  code: string;
  passed: boolean;
  severity: "info" | "warning" | "high";
  message: string;
}

export interface EvidenceGateResult {
  mode: OpenAIProviderMode;
  passed: boolean;
  checks: EvidenceGateCheck[];
  providerCitationCount: number;
  textUrlCitationCount: number;
  webSearchCallCount: number;
}

export interface OpenAIProviderProbeResult {
  provider: "openai";
  model: string;
  timestamp: string;
  text: string;
  citations: OpenAIProviderCitation[];
  usage?: OpenAIProviderUsage;
  rawProviderPayload: {
    provider: "openai";
    endpoint: "responses";
    id?: string;
    model: string;
    createdAt?: number;
    status?: string;
    usage?: OpenAIResponsesResponse["usage"];
    groundedSearch: boolean;
    toolChoice: "required" | "none";
    webSearchCalls: WebSearchCallAudit[];
    citations: OpenAIProviderCitation[];
    providerCitations: OpenAIProviderCitation[];
    textUrlCitations: OpenAIProviderCitation[];
    evidenceGate: EvidenceGateResult;
    promptId: string;
    targetId: string;
    mode: OpenAIProviderMode;
    sampleIndex: number;
  };
}

export interface OpenAIResponsesProviderOptions {
  apiKey?: string;
  cwd?: string;
  fetchImpl?: typeof fetch;
}

export interface OpenAIResponsesProvider {
  provider: "openai";
  probe(input: OpenAIProviderProbeInput): Promise<OpenAIProviderProbeResult>;
}

interface WebSearchCallAudit {
  id?: string;
  status?: string;
  actionType?: string;
  query?: string;
  queries?: string[];
  sources: OpenAIProviderCitation[];
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

export function createOpenAIResponsesProvider(
  options: OpenAIResponsesProviderOptions = {}
): OpenAIResponsesProvider {
  return {
    provider: "openai",
    async probe(input) {
      const apiKey = await resolveOpenAIApiKey(options);
      if (!apiKey) {
        throw new Error(
          'Provider configuration error: Missing OPENAI_API_KEY for provider "openai". Add it to .env or use provider "mock".'
        );
      }

      const timestamp = new Date().toISOString();
      const requestBody = createOpenAIResponsesRequest(input);
      const response = await callOpenAIResponses({
        apiKey,
        requestBody,
        fetchImpl: options.fetchImpl ?? fetch
      });
      const text = extractOpenAIText(response);
      const usage = extractOpenAIUsage(response);
      const model = typeof response.model === "string" ? response.model : input.modelId;
      const providerCitations = extractProviderCitations(response);
      const textUrlCitations = extractTextUrlCitations(text);
      const citations = dedupeCitations([...providerCitations, ...textUrlCitations]);
      const webSearchCalls = extractOpenAIWebSearchCalls(response);
      const evidenceGate = createEvidenceGate({
        mode: input.mode,
        requestedWebSearch: requestBody.requestedWebSearch,
        providerCitationCount: providerCitations.length,
        textUrlCitationCount: textUrlCitations.length,
        webSearchCallCount: webSearchCalls.length
      });

      return {
        provider: "openai",
        model,
        timestamp,
        text,
        citations,
        ...(usage ? { usage } : {}),
        rawProviderPayload: {
          provider: "openai",
          endpoint: "responses",
          ...(typeof response.id === "string" ? { id: response.id } : {}),
          model,
          ...(typeof response.created_at === "number" ? { createdAt: response.created_at } : {}),
          ...(response.status ? { status: response.status } : {}),
          ...(response.usage ? { usage: response.usage } : {}),
          groundedSearch: input.mode === "grounded",
          toolChoice: input.mode === "grounded" ? "required" : "none",
          webSearchCalls,
          citations,
          providerCitations,
          textUrlCitations,
          evidenceGate,
          promptId: input.promptId,
          targetId: input.targetId,
          mode: input.mode,
          sampleIndex: input.sampleIndex
        }
      };
    }
  };
}

function createOpenAIResponsesRequest(input: OpenAIProviderProbeInput): {
  body: Record<string, unknown>;
  requestedWebSearch: boolean;
} {
  const requestedWebSearch = input.mode === "grounded";
  return {
    requestedWebSearch,
    body: {
      model: input.modelId,
      input: [
        {
          role: "system",
          content: createOpenAISystemPrompt(input.mode)
        },
        {
          role: "user",
          content: createOpenAIUserPrompt(input)
        }
      ],
      max_output_tokens: 700,
      ...(requestedWebSearch
        ? {
            tools: [{ type: "web_search", search_context_size: "low" }],
            tool_choice: "required"
          }
        : {})
    }
  };
}

async function callOpenAIResponses(input: {
  apiKey: string;
  requestBody: { body: Record<string, unknown> };
  fetchImpl: typeof fetch;
}): Promise<OpenAIResponsesResponse> {
  const response = await input.fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify(input.requestBody.body)
  });
  const parsed = (await response.json().catch(() => ({}))) as OpenAIResponsesResponse;

  if (!response.ok) {
    const providerMessage = parsed.error?.message ?? response.statusText;
    throw new Error(`OpenAI provider error (${response.status}): ${providerMessage}`);
  }

  return parsed;
}

function createOpenAISystemPrompt(mode: OpenAIProviderMode): string {
  const sourceInstruction =
    mode === "grounded"
      ? "Use web search for source-backed evidence. Do not invent citations."
      : "Answer from model knowledge only. Do not browse and do not invent citations.";

  return [
    "You are participating in an auditable AI Visibility benchmark.",
    "Answer concisely for regulated pharma / QMS software evaluation.",
    sourceInstruction,
    "Do not mention benchmark internals unless directly relevant."
  ].join(" ");
}

function createOpenAIUserPrompt(input: OpenAIProviderProbeInput): string {
  return [
    `Target entity: ${input.targetName}`,
    `Target ID: ${input.targetId}`,
    `Category: ${input.targetCategory}`,
    `Competitor group: ${input.competitorGroup}`,
    `Official domains: ${input.officialDomains.join(", ")}`,
    `Benchmark mode: ${input.mode}`,
    `Prompt ID: ${input.promptId}`,
    `Prompt layer: ${input.promptLayer}`,
    `Buyer intent: ${input.intentBuyer}`,
    "",
    input.promptText
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

function extractOpenAIUsage(response: OpenAIResponsesResponse): OpenAIProviderUsage | undefined {
  const usage = response.usage;
  if (!usage) return undefined;

  return {
    ...(typeof usage.input_tokens === "number" ? { inputTokens: usage.input_tokens } : {}),
    ...(typeof usage.output_tokens === "number" ? { outputTokens: usage.output_tokens } : {}),
    ...(typeof usage.total_tokens === "number" ? { totalTokens: usage.total_tokens } : {})
  };
}

function extractProviderCitations(response: OpenAIResponsesResponse): OpenAIProviderCitation[] {
  const citations: OpenAIProviderCitation[] = [];

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

  return dedupeCitations(citations);
}

function extractOpenAIWebSearchCalls(response: OpenAIResponsesResponse): WebSearchCallAudit[] {
  return (response.output ?? [])
    .filter((item) => item.type === "web_search_call")
    .map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      ...(item.status ? { status: item.status } : {}),
      ...(item.action?.type ? { actionType: item.action.type } : {}),
      ...(item.action?.query ? { query: item.action.query } : {}),
      ...(item.action?.queries ? { queries: item.action.queries } : {}),
      sources: (item.action?.sources ?? []).map((source) =>
        source.url ? createCitation(source.url, source.title) : createTitleOnlyCitation(source.title)
      )
    }));
}

function extractTextUrlCitations(text: string): OpenAIProviderCitation[] {
  const urls = [...text.matchAll(/https?:\/\/[^\s)\]]+/g)].map((match) =>
    match[0].replace(/[.,;:]+$/, "")
  );
  const uniqueUrls = [...new Set(urls)];

  return uniqueUrls.map((url) => createCitation(url));
}

function createEvidenceGate(input: {
  mode: OpenAIProviderMode;
  requestedWebSearch: boolean;
  providerCitationCount: number;
  textUrlCitationCount: number;
  webSearchCallCount: number;
}): EvidenceGateResult {
  const checks =
    input.mode === "grounded"
      ? createGroundedEvidenceChecks(input)
      : createParametricEvidenceChecks(input);

  return {
    mode: input.mode,
    passed: checks.every((check) => check.passed),
    checks,
    providerCitationCount: input.providerCitationCount,
    textUrlCitationCount: input.textUrlCitationCount,
    webSearchCallCount: input.webSearchCallCount
  };
}

function createGroundedEvidenceChecks(input: {
  requestedWebSearch: boolean;
  providerCitationCount: number;
  webSearchCallCount: number;
}): EvidenceGateCheck[] {
  return [
    {
      code: "grounded_web_search_requested",
      passed: input.requestedWebSearch,
      severity: "high",
      message: "Grounded benchmark probes must request OpenAI web search."
    },
    {
      code: "grounded_web_search_observed",
      passed: input.webSearchCallCount > 0,
      severity: "high",
      message: "Grounded benchmark evidence must include at least one web search call."
    },
    {
      code: "grounded_provider_citation_observed",
      passed: input.providerCitationCount > 0,
      severity: "warning",
      message: "Grounded benchmark evidence should include provider-backed citation metadata."
    }
  ];
}

function createParametricEvidenceChecks(input: {
  requestedWebSearch: boolean;
  webSearchCallCount: number;
}): EvidenceGateCheck[] {
  return [
    {
      code: "parametric_web_search_not_requested",
      passed: !input.requestedWebSearch,
      severity: "high",
      message: "Parametric benchmark probes must not request web search."
    },
    {
      code: "parametric_no_web_search_observed",
      passed: input.webSearchCallCount === 0,
      severity: "high",
      message: "Parametric benchmark evidence must not include web search calls."
    }
  ];
}

function createCitation(url: string, title?: string): OpenAIProviderCitation {
  const domain = extractDomain(url);
  return {
    url,
    ...(title ? { title } : {}),
    ...(domain ? { domain } : {})
  };
}

function createTitleOnlyCitation(title?: string): OpenAIProviderCitation {
  return title ? { title } : {};
}

function dedupeCitations(citations: OpenAIProviderCitation[]): OpenAIProviderCitation[] {
  const byKey = new Map<string, OpenAIProviderCitation>();

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

async function resolveOpenAIApiKey(options: OpenAIResponsesProviderOptions): Promise<string | undefined> {
  if (options.apiKey) return options.apiKey;
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  const cwd = options.cwd ?? process.cwd();
  try {
    const envText = await readFile(path.resolve(cwd, ".env"), "utf8");
    for (const line of envText.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^OPENAI_API_KEY=(.*)$/.exec(trimmed);
      if (!match) continue;
      return match[1]?.replace(/^["']|["']$/g, "");
    }
  } catch {
    return undefined;
  }

  return undefined;
}
