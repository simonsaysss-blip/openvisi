import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createProviderAdapter, type ProviderProbeInput } from "./providers.js";

describe("benchmark OpenAI provider", () => {
  const originalOpenAIKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalOpenAIKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fails clearly when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const cwd = await mkdtemp(path.join(tmpdir(), "openvisi-openai-missing-key-"));
    const provider = createProviderAdapter("openai");

    await expect(provider.probe(createProbeInput({ cwd }))).rejects.toThrow(
      "Provider configuration error: Missing OPENAI_API_KEY"
    );
  });

  it("maps grounded OpenAI Responses output into RawResponse metadata", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        input: Array<{ role: string; content: string }>;
        tools?: Array<{ type: string }>;
        tool_choice?: string;
      };

      expect(body.model).toBe("gpt-4o-mini");
      expect(body.input[1]?.content).toContain("Prompt ID: presence");
      expect(body.input[1]?.content).toContain("Target entity: MasterControl");
      expect(body.tools).toEqual([{ type: "web_search", search_context_size: "low" }]);
      expect(body.tool_choice).toBe("required");

      return new Response(
        JSON.stringify({
          id: "resp-test",
          model: "gpt-4o-mini-2026-01-01",
          created_at: 1767225600,
          status: "completed",
          output_text:
            "MasterControl is relevant for pharma QMS. See https://www.mastercontrol.com/.",
          output: [
            {
              type: "web_search_call",
              id: "ws-test",
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
            },
            {
              type: "message",
              content: [
                {
                  type: "output_text",
                  text:
                    "MasterControl is relevant for pharma QMS. See https://www.mastercontrol.com/.",
                  annotations: [
                    {
                      type: "url_citation",
                      url: "https://www.mastercontrol.com/",
                      title: "MasterControl official source"
                    }
                  ]
                }
              ]
            }
          ],
          usage: {
            input_tokens: 42,
            output_tokens: 19,
            total_tokens: 61
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createProviderAdapter("openai");
    const response = await provider.probe(createProbeInput());

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openai-key"
        })
      })
    );
    expect(response.promptId).toBe("presence");
    expect(response.targetId).toBe("mastercontrol");
    expect(response.provider).toBe("openai");
    expect(response.model).toBe("gpt-4o-mini-2026-01-01");
    expect(response.text).toContain("MasterControl");
    expect(response.usage).toEqual({
      inputTokens: 42,
      outputTokens: 19,
      totalTokens: 61
    });
    expect(response.citations).toEqual([
      {
        url: "https://www.mastercontrol.com/",
        title: "MasterControl official source",
        domain: "mastercontrol.com"
      }
    ]);
    expect(response.rawProviderPayload).toEqual(
      expect.objectContaining({
        provider: "openai",
        endpoint: "responses",
        id: "resp-test",
        promptId: "presence",
        targetId: "mastercontrol",
        groundedSearch: true,
        toolChoice: "required",
        webSearchCalls: [
          {
            id: "ws-test",
            status: "completed",
            actionType: "search",
            query: "MasterControl pharma QMS official source",
            queries: undefined,
            sources: [
              {
                url: "https://www.mastercontrol.com/",
                title: "MasterControl official source",
                domain: "mastercontrol.com"
              }
            ]
          }
        ]
      })
    );
  });

  it("does not attach web search tools for parametric OpenAI probes", async () => {
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
          id: "resp-parametric-test",
          model: "gpt-4o-mini-2026-01-01",
          status: "completed",
          output_text: "MasterControl appears in parametric benchmark memory.",
          output: [],
          usage: {
            input_tokens: 10,
            output_tokens: 8,
            total_tokens: 18
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const provider = createProviderAdapter("openai");
    const response = await provider.probe(createProbeInput({ mode: "parametric" }));

    expect(response.mode).toBe("parametric");
    expect(response.citations).toEqual([]);
    expect(response.rawProviderPayload).toEqual(
      expect.objectContaining({
        endpoint: "responses",
        groundedSearch: false,
        toolChoice: "none"
      })
    );
  });
});

function createProbeInput(overrides: Partial<ProviderProbeInput> = {}): ProviderProbeInput {
  return {
    prompt: {
      id: "presence",
      text: "Which QMS vendors are considered for pharma?",
      layer: "Presence",
      category: "pharma-qms",
      intentBuyer: "quality leader"
    },
    target: {
      id: "mastercontrol",
      name: "MasterControl",
      category: "Pharma QMS",
      competitorGroup: "pharma-qms",
      officialDomains: ["mastercontrol.com"]
    },
    mode: "grounded",
    model: {
      provider: "openai",
      modelId: "gpt-4o-mini"
    },
    sampleIndex: 0,
    runConfig: {
      models: [{ provider: "openai", modelId: "gpt-4o-mini" }],
      modes: ["grounded"],
      samplesPerCell: 1,
      dateLabel: "Pharma / QMS AI Visibility Benchmark 2026"
    },
    cwd: process.cwd(),
    ...overrides
  };
}
