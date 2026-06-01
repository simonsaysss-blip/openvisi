import path from "node:path";
import {
  ConfigSnapshotSchema,
  PromptSchema,
  RunConfigSchema,
  TargetSchema,
  type ConfigSnapshot,
  type Prompt,
  type RunConfig,
  type Target
} from "./schemas.js";
import { readJsonArrayFile, readJsonFile } from "./io.js";

export interface BenchmarkInputs {
  runConfig: RunConfig;
  targets: Target[];
  prompts: Prompt[];
  configPath: string;
}

export async function loadBenchmarkInputs(input: {
  cwd?: string;
  configPath: string;
}): Promise<BenchmarkInputs> {
  const cwd = input.cwd ?? process.cwd();
  const configPath = path.resolve(cwd, input.configPath);
  const targetsPath = path.resolve(cwd, "specs/targets.json");
  const promptsPath = path.resolve(cwd, "specs/prompts.json");

  const runConfig = await readJsonFile(configPath, RunConfigSchema, input.configPath);
  const targets = await readJsonArrayFile(targetsPath, TargetSchema, "specs/targets.json");
  const prompts = await readJsonArrayFile(promptsPath, PromptSchema, "specs/prompts.json");

  return {
    runConfig,
    targets,
    prompts,
    configPath
  };
}

export function createConfigSnapshot(input: {
  runConfig: RunConfig;
  targets: Target[];
  prompts: Prompt[];
}): ConfigSnapshot {
  return ConfigSnapshotSchema.parse({
    schemaVersion: "0.1",
    runConfig: input.runConfig,
    targets: input.targets,
    prompts: input.prompts
  });
}
