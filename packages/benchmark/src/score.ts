import path from "node:path";
import {
  ConfigSnapshotSchema,
  MetricResultSchema,
  benchmarkMetricNames,
  type BenchmarkMetricName,
  type MetricResult,
  type RawResponse,
  type Target
} from "./schemas.js";
import { readJsonFile, writeJsonFile } from "./io.js";
import { isRawResponseRecord, readBenchmarkRecords, resolveRunDir } from "./run.js";

export interface ScoreBenchmarkOptions {
  runId: string;
  cwd?: string;
}

export interface ScoreBenchmarkResult {
  runId: string;
  runDir: string;
  metricsPath: string;
  metricCount: number;
}

export async function scoreBenchmark(options: ScoreBenchmarkOptions): Promise<ScoreBenchmarkResult> {
  const runDir = resolveRunDir({
    runId: options.runId,
    ...(options.cwd ? { cwd: options.cwd } : {})
  });
  const snapshot = await readJsonFile(
    path.join(runDir, "config.snapshot.json"),
    ConfigSnapshotSchema,
    "config.snapshot.json"
  );
  const records = await readBenchmarkRecords(runDir);
  const responses = records.filter(isRawResponseRecord) as RawResponse[];
  const metrics: MetricResult[] = [];

  for (const target of snapshot.targets) {
    for (const model of snapshot.runConfig.models) {
      for (const mode of snapshot.runConfig.modes) {
        const sample = responses.filter(
          (response) =>
            response.targetId === target.id &&
            response.provider === model.provider &&
            response.model === model.modelId &&
            response.mode === mode
        );

        for (const metricName of benchmarkMetricNames) {
          metrics.push(
            createMetricResult({
              metricName,
              target,
              targets: snapshot.targets,
              provider: model.provider,
              model: model.modelId,
              mode,
              responses: sample
            })
          );
        }
      }
    }
  }

  const validated = metrics.map((metric) => MetricResultSchema.parse(metric));
  const metricsPath = path.join(runDir, "metrics.json");
  await writeJsonFile(metricsPath, validated);

  return {
    runId: options.runId,
    runDir,
    metricsPath,
    metricCount: validated.length
  };
}

function createMetricResult(input: {
  metricName: BenchmarkMetricName;
  target: Target;
  targets: Target[];
  provider: string;
  model: string;
  mode: "grounded" | "parametric";
  responses: RawResponse[];
}): MetricResult {
  const values = input.responses.map((response) =>
    evaluateMetric(input.metricName, response, input.target, input.targets)
  );
  const sampleCount = values.length;
  const value =
    sampleCount > 0
      ? values.reduce((total, current) => total + current, 0) / sampleCount
      : 0;
  const confidenceInterval = sampleCount > 0 ? createConfidenceInterval(value, sampleCount) : undefined;

  return MetricResultSchema.parse({
    targetId: input.target.id,
    provider: input.provider,
    model: input.model,
    mode: input.mode,
    metric: input.metricName,
    value,
    sampleCount,
    ...(confidenceInterval ? { confidenceInterval } : {})
  });
}

function evaluateMetric(
  metricName: BenchmarkMetricName,
  response: RawResponse,
  target: Target,
  targets: Target[]
): number {
  if (metricName === "Mention Rate") {
    return containsName(response.text, target.name) ? 1 : 0;
  }

  if (metricName === "Citation Coverage") {
    return response.citations.length > 0 ? 1 : 0;
  }

  if (metricName === "Official Source Citation Rate") {
    return response.citations.some((citation) =>
      target.officialDomains.some(
        (domain) => normalizeDomain(citation.domain ?? citation.url ?? "") === normalizeDomain(domain)
      )
    )
      ? 1
      : 0;
  }

  if (metricName === "Competitor Displacement") {
    const targetMentioned = containsName(response.text, target.name);
    const competitors = targets.filter(
      (candidate) =>
        candidate.competitorGroup === target.competitorGroup && candidate.id !== target.id
    );
    const competitorMentioned = competitors.some((competitor) =>
      containsName(response.text, competitor.name)
    );
    return competitorMentioned && !targetMentioned ? 1 : 0;
  }

  return 0;
}

function containsName(text: string, name: string): boolean {
  return text.toLowerCase().includes(name.toLowerCase());
}

function normalizeDomain(input: string): string {
  try {
    const parsed = input.includes("://") ? new URL(input) : new URL(`https://${input}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.replace(/^www\./, "").toLowerCase();
  }
}

function createConfidenceInterval(value: number, sampleCount: number): { low: number; high: number } {
  const standardError = Math.sqrt((value * (1 - value)) / sampleCount);
  const margin = 1.96 * standardError;
  return {
    low: Math.max(0, value - margin),
    high: Math.min(1, value + margin)
  };
}
