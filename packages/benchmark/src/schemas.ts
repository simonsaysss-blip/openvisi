import { z } from "zod";

export const BenchmarkModeSchema = z.enum(["grounded", "parametric"]);

export const BenchmarkLayerSchema = z.enum([
  "Presence",
  "Accuracy",
  "Citation",
  "Competitive"
]);

export const TargetSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    competitorGroup: z.string().min(1),
    officialDomains: z.array(z.string().min(1)).min(1)
  })
  .strict();

export const PromptSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    layer: BenchmarkLayerSchema,
    category: z.string().min(1),
    intentBuyer: z.string().min(1)
  })
  .strict();

export const ModelConfigSchema = z
  .object({
    provider: z.string().min(1),
    modelId: z.string().min(1)
  })
  .strict();

export const RunConfigSchema = z
  .object({
    models: z.array(ModelConfigSchema).min(1),
    modes: z.array(BenchmarkModeSchema).min(1),
    samplesPerCell: z.number().int().positive(),
    judgeModel: z.string().min(1).optional(),
    dateLabel: z.string().min(1)
  })
  .strict();

export const CitationSchema = z
  .object({
    url: z.string().optional(),
    title: z.string().optional(),
    domain: z.string().optional()
  })
  .strict();

export const UsageSchema = z
  .object({
    inputTokens: z.number().int().nonnegative().optional(),
    outputTokens: z.number().int().nonnegative().optional(),
    totalTokens: z.number().int().nonnegative().optional()
  })
  .strict();

export const RawResponseSchema = z
  .object({
    promptId: z.string().min(1),
    targetId: z.string().min(1).optional(),
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: BenchmarkModeSchema,
    sampleIndex: z.number().int().nonnegative(),
    timestamp: z.string().datetime(),
    text: z.string(),
    citations: z.array(CitationSchema),
    usage: UsageSchema.optional(),
    rawProviderPayload: z.unknown().optional()
  })
  .strict();

export const BenchmarkErrorRecordSchema = z
  .object({
    recordType: z.literal("error"),
    promptId: z.string().min(1),
    targetId: z.string().min(1),
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: BenchmarkModeSchema,
    sampleIndex: z.number().int().nonnegative(),
    timestamp: z.string().datetime(),
    cacheKey: z.string().min(1),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1)
      })
      .strict()
  })
  .strict();

export const BenchmarkJsonlRecordSchema = z.union([
  RawResponseSchema,
  BenchmarkErrorRecordSchema
]);

export const MetricResultSchema = z
  .object({
    targetId: z.string().min(1),
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: BenchmarkModeSchema,
    metric: z.string().min(1),
    value: z.number(),
    sampleCount: z.number().int().nonnegative(),
    confidenceInterval: z
      .object({
        low: z.number(),
        high: z.number()
      })
      .strict()
      .optional()
  })
  .strict();

export const ConfigSnapshotSchema = z
  .object({
    schemaVersion: z.literal("0.1"),
    runConfig: RunConfigSchema,
    targets: z.array(TargetSchema),
    prompts: z.array(PromptSchema)
  })
  .strict();

export const BenchmarkManifestSchema = z
  .object({
    schemaVersion: z.literal("0.1"),
    runId: z.string().min(1),
    title: z.literal("Pharma / QMS AI Visibility Benchmark 2026"),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    dateLabel: z.string().min(1),
    storage: z.string().min(1),
    configPath: z.string().min(1),
    configSnapshot: z.literal("config.snapshot.json"),
    rawResponses: z.literal("raw/responses.jsonl"),
    cacheIndex: z.literal("raw/cache-index.json"),
    targetCount: z.number().int().nonnegative(),
    promptCount: z.number().int().nonnegative(),
    models: z.array(ModelConfigSchema),
    modes: z.array(BenchmarkModeSchema),
    samplesPerCell: z.number().int().positive(),
    totalCells: z.number().int().nonnegative(),
    completedResponses: z.number().int().nonnegative(),
    errorRecords: z.number().int().nonnegative(),
    cacheHits: z.number().int().nonnegative(),
    methodology: z
      .object({
        disclosure: z.string().min(1),
        scoring: z.string().min(1),
        groundedVsParametric: z.string().min(1)
      })
      .strict()
  })
  .strict();

export const PricingSchema = z
  .object({
    schemaVersion: z.literal("0.1"),
    currency: z.literal("USD"),
    models: z.array(
      z
        .object({
          provider: z.string().min(1),
          modelId: z.string().min(1),
          inputUsdPer1MTokens: z.number().nonnegative(),
          outputUsdPer1MTokens: z.number().nonnegative()
        })
        .strict()
    )
  })
  .strict();

export type BenchmarkMode = z.infer<typeof BenchmarkModeSchema>;
export type Target = z.infer<typeof TargetSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type RunConfig = z.infer<typeof RunConfigSchema>;
export type RawResponse = z.infer<typeof RawResponseSchema>;
export type BenchmarkErrorRecord = z.infer<typeof BenchmarkErrorRecordSchema>;
export type BenchmarkJsonlRecord = z.infer<typeof BenchmarkJsonlRecordSchema>;
export type MetricResult = z.infer<typeof MetricResultSchema>;
export type ConfigSnapshot = z.infer<typeof ConfigSnapshotSchema>;
export type BenchmarkManifest = z.infer<typeof BenchmarkManifestSchema>;
export type Pricing = z.infer<typeof PricingSchema>;

export const benchmarkMetricNames = [
  "Mention Rate",
  "Citation Coverage",
  "Official Source Citation Rate",
  "Competitor Displacement"
] as const;

export type BenchmarkMetricName = (typeof benchmarkMetricNames)[number];

export function validateTarget(input: unknown): Target {
  return TargetSchema.parse(input);
}

export function validatePrompt(input: unknown): Prompt {
  return PromptSchema.parse(input);
}

export function validateRunConfig(input: unknown): RunConfig {
  return RunConfigSchema.parse(input);
}

export function validateRawResponse(input: unknown): RawResponse {
  return RawResponseSchema.parse(input);
}

export function validateMetricResult(input: unknown): MetricResult {
  return MetricResultSchema.parse(input);
}
