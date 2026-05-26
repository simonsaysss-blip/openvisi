import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  type CompetitorSpec,
  type OpenVisiScanConfig,
  type PromptSpec,
  type ScanProviderConfig,
  createDefaultPromptPack
} from "@openvisi/core";
import type { PromptPackInput } from "@openvisi/core";

export interface OpenVisiConfigInput {
  brandName?: string;
  domain?: string;
  category?: string;
  competitors?: CompetitorSpec[];
  providers?: ScanProviderConfig[];
  outputDir?: string;
  includeExperimentalMetrics?: boolean;
  promptPack?: PromptSpec[];
  promptPackInput?: {
    audience?: string;
    problems?: string[];
    integrations?: string[];
  };
}

export interface ConfigOverrides {
  outputDir?: string;
  provider?: string;
  includeExperimentalMetrics?: boolean;
}

export async function loadOpenVisiConfig(configPath: string): Promise<OpenVisiConfigInput> {
  const resolvedPath = path.resolve(process.cwd(), configPath);
  const raw = await readFile(resolvedPath, "utf8");
  return JSON.parse(raw) as OpenVisiConfigInput;
}

export function materializeScanConfig(
  input: OpenVisiConfigInput,
  overrides: ConfigOverrides = {}
): OpenVisiScanConfig {
  const brandName = input.brandName ?? "";
  const domain = input.domain ?? "";
  const category = input.category ?? "";
  const competitors = input.competitors ?? [];
  const providers = materializeProviders(input.providers, overrides.provider);
  const outputDir = overrides.outputDir ?? input.outputDir ?? "openvisi-report";
  const includeExperimentalMetrics =
    overrides.includeExperimentalMetrics ?? input.includeExperimentalMetrics ?? false;
  const promptPack =
    input.promptPack ??
    createDefaultPromptPack(
      materializePromptPackInput({
        brandName,
        domain,
        category,
        competitors,
        promptPackInput: input.promptPackInput
      })
    );

  return {
    brandName,
    domain,
    category,
    competitors,
    promptPack,
    providers,
    outputDir,
    includeExperimentalMetrics
  };
}

function materializeProviders(
  providers: ScanProviderConfig[] | undefined,
  providerOverride: string | undefined
): ScanProviderConfig[] {
  if (providerOverride) {
    return [
      {
        provider: providerOverride,
        enabled: true
      }
    ];
  }

  if (providers && providers.length > 0) return providers;

  return [
    {
      provider: "mock",
      enabled: true
    }
  ];
}

function materializePromptPackInput(input: {
  brandName: string;
  domain: string;
  category: string;
  competitors: CompetitorSpec[];
  promptPackInput?: OpenVisiConfigInput["promptPackInput"];
}): PromptPackInput {
  return {
    brandName: input.brandName,
    domain: input.domain,
    category: input.category,
    competitors: input.competitors,
    ...(input.promptPackInput?.audience ? { audience: input.promptPackInput.audience } : {}),
    ...(input.promptPackInput?.problems ? { problems: input.promptPackInput.problems } : {}),
    ...(input.promptPackInput?.integrations
      ? { integrations: input.promptPackInput.integrations }
      : {})
  };
}
