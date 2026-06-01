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

  it("maps OpenAI chat completion output into RawResponse metadata", async () => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        model: string;
        messages: Array<{ role: string; content: string }>;
      };

      expect(body.model).toBe("gpt-4o-mini");
      expect(body.messages[1]?.content).toContain("Prompt ID: presence");
      expect(body.messages[1]?.content).toContain("Target entity: MasterControl");

      return new Response(
        JSON.stringify({
          id: "chatcmpl-test",
          model: "gpt-4o-mini-2026-01-01",
          created: 1767225600,
          choices: [
            {
              message: {
                content:
                  "MasterControl is relevant for pharma QMS. See https://www.mastercontrol.com/."
              },
              finish_reason: "stop"
            }
          ],
          usage: {
            prompt_tokens: 42,
            completion_tokens: 19,
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
      "https://api.openai.com/v1/chat/completions",
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
        domain: "mastercontrol.com"
      }
    ]);
    expect(response.rawProviderPayload).toEqual(
      expect.objectContaining({
        provider: "openai",
        endpoint: "chat.completions",
        id: "chatcmpl-test",
        promptId: "presence",
        targetId: "mastercontrol",
        finishReason: "stop"
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
