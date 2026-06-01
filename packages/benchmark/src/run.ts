import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BenchmarkJsonlRecordSchema,
  BenchmarkManifestSchema,
  RawResponseSchema,
  type BenchmarkErrorRecord,
  type BenchmarkJsonlRecord,
  type BenchmarkManifest,
  type ModelConfig,
  type Prompt,
  type RunConfig,
  type Target
} from "./schemas.js";
import { appendJsonlRecord, ensureDir, readJsonlFile, writeJsonFile } from "./io.js";
import { createConfigSnapshot, loadBenchmarkInputs } from "./specLoader.js";
import { createProviderAdapter } from "./providers.js";
import { createRunId, stableHash } from "./hash.js";

export interface RunBenchmarkOptions {
  configPath: string;
  cwd?: string;
}

export interface BenchmarkRunResult {
  runId: string;
  runDir: string;
  rawResponsesPath: string;
  manifestPath: string;
  configSnapshotPath: string;
  completedResponses: number;
  errorRecords: number;
  cacheHits: number;
}

type CacheIndex = Record<string, { status: "response" | "error"; timestamp: string }>;

export async function runBenchmark(options: RunBenchmarkOptions): Promise<BenchmarkRunResult> {
  const cwd = options.cwd ?? process.cwd();
  const inputs = await loadBenchmarkInputs({ cwd, configPath: options.configPath });
  const runId = createRunId(inputs.runConfig.dateLabel);
  const runDir = path.resolve(cwd, "runs", runId);
  const rawDir = path.join(runDir, "raw");
  const rawResponsesPath = path.join(rawDir, "responses.jsonl");
  const cacheIndexPath = path.join(rawDir, "cache-index.json");
  const manifestPath = path.join(runDir, "manifest.json");
  const configSnapshotPath = path.join(runDir, "config.snapshot.json");
  const configKey = stableHash(inputs.runConfig);
  const cacheIndex = await readCacheIndex(cacheIndexPath);
  let cacheHits = 0;

  await ensureDir(rawDir);
  await writeJsonFile(
    configSnapshotPath,
    createConfigSnapshot({
      runConfig: inputs.runConfig,
      targets: inputs.targets,
      prompts: inputs.prompts
    })
  );

  for (const target of inputs.targets) {
    for (const prompt of inputs.prompts) {
      for (const model of inputs.runConfig.models) {
        for (const mode of inputs.runConfig.modes) {
          for (let sampleIndex = 0; sampleIndex < inputs.runConfig.samplesPerCell; sampleIndex += 1) {
            const cacheKey = createCacheKey({
              prompt,
              target,
              model,
              mode,
              sampleIndex,
              configKey
            });

            if (cacheIndex[cacheKey]) {
              cacheHits += 1;
              continue;
            }

            const timestamp = new Date().toISOString();
            try {
              const adapter = createProviderAdapter(model.provider);
              const response = await adapter.probe({
                prompt,
                target,
                mode,
                model,
                sampleIndex,
                runConfig: inputs.runConfig,
                cwd
              });
              const validated = RawResponseSchema.parse(response);
              await appendJsonlRecord(rawResponsesPath, validated);
              cacheIndex[cacheKey] = { status: "response", timestamp };
            } catch (error) {
              const record = createErrorRecord({
                error,
                prompt,
                target,
                model,
                mode,
                sampleIndex,
                cacheKey,
                timestamp
              });
              await appendJsonlRecord(rawResponsesPath, record);
              cacheIndex[cacheKey] = { status: "error", timestamp };
            }

            await writeJsonFile(cacheIndexPath, cacheIndex);
          }
        }
      }
    }
  }

  await writeJsonFile(cacheIndexPath, cacheIndex);
  const records = await readRecordsIfPresent(rawResponsesPath);
  const completedResponses = records.filter(isRawResponseRecord).length;
  const errorRecords = records.filter(isErrorRecord).length;
  const generatedAt = new Date().toISOString();
  const manifest = createManifest({
    runId,
    generatedAt,
    cwd,
    runDir,
    configPath: path.relative(cwd, inputs.configPath),
    runConfig: inputs.runConfig,
    targets: inputs.targets,
    prompts: inputs.prompts,
    completedResponses,
    errorRecords,
    cacheHits
  });
  await writeJsonFile(manifestPath, manifest);

  return {
    runId,
    runDir,
    rawResponsesPath,
    manifestPath,
    configSnapshotPath,
    completedResponses,
    errorRecords,
    cacheHits
  };
}

export function createCacheKey(input: {
  prompt: Prompt;
  target: Target;
  model: ModelConfig;
  mode: string;
  configKey: string;
  sampleIndex: number;
}): string {
  return stableHash({
    promptText: input.prompt.text,
    targetId: input.target.id,
    model: `${input.model.provider}:${input.model.modelId}`,
    mode: input.mode,
    configKey: input.configKey,
    sampleIndex: input.sampleIndex
  });
}

export async function readBenchmarkRecords(runDir: string): Promise<BenchmarkJsonlRecord[]> {
  return readJsonlFile(
    path.join(runDir, "raw/responses.jsonl"),
    BenchmarkJsonlRecordSchema,
    "raw/responses.jsonl"
  );
}

export async function readBenchmarkManifest(runDir: string): Promise<BenchmarkManifest> {
  const manifest = JSON.parse(await readFile(path.join(runDir, "manifest.json"), "utf8")) as unknown;
  return BenchmarkManifestSchema.parse(manifest);
}

export function resolveRunDir(input: { cwd?: string; runId: string }): string {
  return path.resolve(input.cwd ?? process.cwd(), "runs", input.runId);
}

export function isRawResponseRecord(
  record: BenchmarkJsonlRecord
): record is BenchmarkJsonlRecord & { text: string } {
  return "text" in record;
}

function isErrorRecord(record: BenchmarkJsonlRecord): record is BenchmarkErrorRecord {
  return "recordType" in record && record.recordType === "error";
}

async function readCacheIndex(cacheIndexPath: string): Promise<CacheIndex> {
  try {
    return JSON.parse(await readFile(cacheIndexPath, "utf8")) as CacheIndex;
  } catch {
    return {};
  }
}

async function readRecordsIfPresent(rawResponsesPath: string): Promise<BenchmarkJsonlRecord[]> {
  try {
    return await readJsonlFile(rawResponsesPath, BenchmarkJsonlRecordSchema, "raw/responses.jsonl");
  } catch {
    return [];
  }
}

function createErrorRecord(input: {
  error: unknown;
  prompt: Prompt;
  target: Target;
  model: ModelConfig;
  mode: "grounded" | "parametric";
  sampleIndex: number;
  cacheKey: string;
  timestamp: string;
}): BenchmarkErrorRecord {
  const message = input.error instanceof Error ? input.error.message : "Unknown provider error";
  return {
    recordType: "error",
    promptId: input.prompt.id,
    targetId: input.target.id,
    provider: input.model.provider,
    model: input.model.modelId,
    mode: input.mode,
    sampleIndex: input.sampleIndex,
    timestamp: input.timestamp,
    cacheKey: input.cacheKey,
    error: {
      code: "provider_error",
      message
    }
  };
}

function createManifest(input: {
  runId: string;
  generatedAt: string;
  cwd: string;
  runDir: string;
  configPath: string;
  runConfig: RunConfig;
  targets: Target[];
  prompts: Prompt[];
  completedResponses: number;
  errorRecords: number;
  cacheHits: number;
}): BenchmarkManifest {
  const totalCells =
    input.targets.length *
    input.prompts.length *
    input.runConfig.models.length *
    input.runConfig.modes.length *
    input.runConfig.samplesPerCell;

  return BenchmarkManifestSchema.parse({
    schemaVersion: "0.1",
    runId: input.runId,
    title: "Pharma / QMS AI Visibility Benchmark 2026",
    createdAt: input.generatedAt,
    updatedAt: input.generatedAt,
    dateLabel: input.runConfig.dateLabel,
    storage: path.relative(input.cwd, input.runDir) || input.runDir,
    configPath: input.configPath,
    configSnapshot: "config.snapshot.json",
    rawResponses: "raw/responses.jsonl",
    cacheIndex: "raw/cache-index.json",
    targetCount: input.targets.length,
    promptCount: input.prompts.length,
    models: input.runConfig.models,
    modes: input.runConfig.modes,
    samplesPerCell: input.runConfig.samplesPerCell,
    totalCells,
    completedResponses: input.completedResponses,
    errorRecords: input.errorRecords,
    cacheHits: input.cacheHits,
    methodology: {
      disclosure:
        "This benchmark uses a flat-file CLI harness. It iterates target x prompt x model x mode x sampleIndex and stores auditable JSONL responses under the run directory.",
      scoring:
        "Rule-based v0.1 metrics only: Mention Rate, Citation Coverage, Official Source Citation Rate, and Competitor Displacement.",
      groundedVsParametric:
        "Grounded and parametric responses are stored and scored separately. Results are never mixed across modes."
    }
  });
}
