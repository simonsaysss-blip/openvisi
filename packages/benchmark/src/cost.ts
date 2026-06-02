import path from "node:path";
import {
  ConfigSnapshotSchema,
  PricingSchema,
  type Pricing,
  type Prompt,
  type RawResponse
} from "./schemas.js";
import { readJsonFile, writeJsonFile } from "./io.js";
import { isRawResponseRecord, readBenchmarkRecords, resolveRunDir } from "./run.js";

export interface CostBenchmarkOptions {
  runId: string;
  cwd?: string;
}

export interface CostBenchmarkResult {
  runId: string;
  runDir: string;
  costPath: string;
  totalBenchmarkCost: number | "unknown";
}

interface CostGroup {
  inputTokens: number;
  outputTokens: number;
  missingUsage: boolean;
  responseCount: number;
}

export async function estimateBenchmarkCost(
  options: CostBenchmarkOptions
): Promise<CostBenchmarkResult> {
  const cwd = options.cwd ?? process.cwd();
  const runDir = resolveRunDir({ cwd, runId: options.runId });
  const snapshot = await readJsonFile(
    path.join(runDir, "config.snapshot.json"),
    ConfigSnapshotSchema,
    "config.snapshot.json"
  );
  const pricing = await readJsonFile(
    path.resolve(cwd, "specs/pricing.json"),
    PricingSchema,
    "specs/pricing.json"
  );
  const records = await readBenchmarkRecords(runDir);
  const responses = records.filter(isRawResponseRecord) as RawResponse[];
  const promptById = new Map(snapshot.prompts.map((prompt) => [prompt.id, prompt]));
  const costByProviderModel = createProviderModelCosts(responses, pricing);
  const costByTarget = createTargetCosts(responses, pricing);
  const costPerTargetPerPromptPack = createTargetPromptPackCosts(responses, promptById, pricing);
  const knownCosts = costByProviderModel.every((item) => item.status === "known");
  const totalBenchmarkCost = knownCosts
    ? roundUsd(
        costByProviderModel.reduce((total, item) => total + (item.estimatedCostUsd ?? 0), 0)
      )
    : "unknown";
  const costReport = {
    schemaVersion: "0.1",
    runId: options.runId,
    generatedAt: new Date().toISOString(),
    currency: "USD",
    totalBenchmarkCost,
    costByProviderModel,
    costByTarget,
    costPerTargetPerPromptPack,
    notes: [
      "If token usage or pricing is missing, the relevant cost is reported as unknown.",
      "This is a flat-file estimate from raw response token usage; it is not a billing source of truth."
    ]
  };
  const costPath = path.join(runDir, "cost.json");
  await writeJsonFile(costPath, costReport);

  return {
    runId: options.runId,
    runDir,
    costPath,
    totalBenchmarkCost
  };
}

function createProviderModelCosts(responses: RawResponse[], pricing: Pricing) {
  const groups = groupCosts(responses, (response) => `${response.provider}\t${response.model}`);
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const [provider, model] = key.split("\t") as [string, string];
      return createCostRow({ provider, model, group, pricing });
    });
}

function createTargetCosts(responses: RawResponse[], pricing: Pricing) {
  const groups = groupRawResponses(responses, (response) => response.targetId ?? "unknown-target");
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([targetId, group]) => ({
      targetId,
      ...createMixedCost(group, pricing)
    }));
}

function createTargetPromptPackCosts(
  responses: RawResponse[],
  promptById: Map<string, Prompt>,
  pricing: Pricing
) {
  const groups = groupRawResponses(responses, (response) => {
    const prompt = promptById.get(response.promptId);
    return `${response.targetId ?? "unknown-target"}\t${prompt?.category ?? "unknown-prompt-pack"}`;
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const [targetId, promptPack] = key.split("\t") as [string, string];
      return {
        targetId,
        promptPack,
        ...createMixedCost(group, pricing)
      };
    });
}

function createCostRow(input: {
  provider: string;
  model: string;
  group: CostGroup;
  pricing: Pricing;
}) {
  const price = findPrice(input.pricing, input.provider, input.model);
  const status = input.group.missingUsage || !price ? "unknown" : "known";
  const estimatedCostUsd =
    status === "known" && price
      ? roundUsd(
          (input.group.inputTokens / 1_000_000) * price.inputUsdPer1MTokens +
            (input.group.outputTokens / 1_000_000) * price.outputUsdPer1MTokens
        )
      : null;

  return {
    provider: input.provider,
    model: input.model,
    responseCount: input.group.responseCount,
    inputTokens: input.group.missingUsage ? "unknown" : input.group.inputTokens,
    outputTokens: input.group.missingUsage ? "unknown" : input.group.outputTokens,
    estimatedCostUsd,
    status
  };
}

function createMixedCost(responses: RawResponse[], pricing: Pricing) {
  const modelGroups = groupCosts(responses, (response) => `${response.provider}\t${response.model}`);
  const rows = [...modelGroups.entries()].map(([key, group]) => {
    const [provider, model] = key.split("\t") as [string, string];
    return createCostRow({ provider, model, group, pricing });
  });
  const known = rows.every((row) => row.status === "known");
  return {
    responseCount: responses.length,
    estimatedCostUsd: known
      ? roundUsd(rows.reduce((total, row) => total + (row.estimatedCostUsd ?? 0), 0))
      : "unknown"
  };
}

function groupRawResponses(
  responses: RawResponse[],
  getKey: (response: RawResponse) => string
): Map<string, RawResponse[]> {
  const groups = new Map<string, RawResponse[]>();
  for (const response of responses) {
    const key = getKey(response);
    groups.set(key, [...(groups.get(key) ?? []), response]);
  }
  return groups;
}

function groupCosts(
  responses: RawResponse[],
  getKey: (response: RawResponse) => string
): Map<string, CostGroup> {
  const groups = new Map<string, CostGroup>();

  for (const response of responses) {
    const key = getKey(response);
    const existing = groups.get(key) ?? {
      inputTokens: 0,
      outputTokens: 0,
      missingUsage: false,
      responseCount: 0
    };
    const inputTokens = response.usage?.inputTokens;
    const outputTokens = response.usage?.outputTokens;

    groups.set(key, {
      inputTokens: existing.inputTokens + (inputTokens ?? 0),
      outputTokens: existing.outputTokens + (outputTokens ?? 0),
      missingUsage:
        existing.missingUsage ||
        typeof inputTokens !== "number" ||
        typeof outputTokens !== "number",
      responseCount: existing.responseCount + 1
    });
  }

  return groups;
}

function findPrice(pricing: Pricing, provider: string, model: string) {
  return pricing.models.find(
    (entry) =>
      entry.provider.toLowerCase() === provider.toLowerCase() &&
      entry.modelId.toLowerCase() === model.toLowerCase()
  );
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
