import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenAIResponsesProvider, type OpenAIProviderProbeInput } from "./openai.js";

describe("OpenAI Responses provider", () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
    vi.restoreAllMocks();
  });

  it("fails clearly when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const cwd = await mkdtemp(path.join(tmpdir(), "openvisi-provider-missing-key-"));
    const provider = createOpenAIResponsesProvider({ cwd });

    await expect(provider.probe(createProbeInput())).rejects.toThrow(
      "Provider configuration error: Missing OPENAI_API_KEY"
    );
  });

  it("requires web search and passes evidence gates for grounded probes with citations", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        tools?: Array<{ type: string; search_context_size: string }>;
        tool_choice?: string;
      };

      expect(body.tools).toEqual([{ type: "web_search", search_context_size: "low" }]);
      expect(body.tool_choice).toBe("required");

      return new Response(
        JSON.stringify({
          id: "resp-grounded",
          model: "gpt-4.1-mini-2026-01-01",
          status: "completed",
          output_text: "MasterControl is relevant for pharma QMS.",
          output: [
            {
              type: "web_search_call",
              id: "ws-grounded",
              status: "completed",
              action: {
                type: "search",
                query: "MasterControl pharma QMS official source",
                sources: [
                  {
                    url: "https://www.mastercontrol.com/",
                    title: "MasterControl official source"
                  }
                ]
              }
            }
          ],
          usage: {
            input_tokens: 12,
            output_tokens: 10,
            total_tokens: 22
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const provider = createOpenAIResponsesProvider({ fetchImpl: fetchMock });
    const result = await provider.probe(createProbeInput());

    expect(result.model).toBe("gpt-4.1-mini-2026-01-01");
    expect(result.citations).toEqual([
      {
        url: "https://www.mastercontrol.com/",
        title: "MasterControl official source",
        domain: "mastercontrol.com"
      }
    ]);
    expect(result.rawProviderPayload.evidenceGate).toEqual(
      expect.objectContaining({
        mode: "grounded",
        passed: true,
        providerCitationCount: 1,
        textUrlCitationCount: 0,
        webSearchCallCount: 1
      })
    );
  });

  it("marks grounded evidence as failed when provider web search evidence is absent", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "resp-grounded-no-evidence",
          model: "gpt-4.1-mini",
          status: "completed",
          output_text: "MasterControl is relevant for pharma QMS.",
          output: []
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const provider = createOpenAIResponsesProvider({ fetchImpl: fetchMock });
    const result = await provider.probe(createProbeInput());
    const failedCodes = result.rawProviderPayload.evidenceGate.checks
      .filter((check) => !check.passed)
      .map((check) => check.code);

    expect(result.rawProviderPayload.evidenceGate.passed).toBe(false);
    expect(failedCodes).toEqual([
      "grounded_web_search_observed",
      "grounded_provider_citation_observed"
    ]);
  });

  it("keeps parametric probes free of web search evidence requirements", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        tools?: unknown;
        tool_choice?: unknown;
      };

      expect(body.tools).toBeUndefined();
      expect(body.tool_choice).toBeUndefined();

      return new Response(
        JSON.stringify({
          id: "resp-parametric",
          model: "gpt-4.1-mini",
          status: "completed",
          output_text: "MasterControl appears in parametric benchmark memory.",
          output: []
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const provider = createOpenAIResponsesProvider({ fetchImpl: fetchMock });
    const result = await provider.probe(createProbeInput({ mode: "parametric" }));

    expect(result.rawProviderPayload.evidenceGate).toEqual(
      expect.objectContaining({
        mode: "parametric",
        passed: true,
        webSearchCallCount: 0
      })
    );
  });
});

function createProbeInput(
  overrides: Partial<OpenAIProviderProbeInput> = {}
): OpenAIProviderProbeInput {
  return {
    promptId: "presence",
    promptText: "Which QMS vendors are considered for pharma?",
    promptLayer: "Presence",
    targetId: "mastercontrol",
    targetName: "MasterControl",
    targetCategory: "Pharma QMS",
    competitorGroup: "pharma-qms",
    officialDomains: ["mastercontrol.com"],
    intentBuyer: "quality leader",
    mode: "grounded",
    modelId: "gpt-4.1-mini",
    sampleIndex: 0,
    ...overrides
  };
}
