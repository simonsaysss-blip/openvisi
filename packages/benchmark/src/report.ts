import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ConfigSnapshotSchema,
  MetricResultSchema,
  type BenchmarkManifest,
  type MetricResult,
  type Target
} from "./schemas.js";
import { readJsonFile } from "./io.js";
import { readBenchmarkManifest, resolveRunDir } from "./run.js";

export interface ReportBenchmarkOptions {
  runId: string;
  cwd?: string;
}

export interface ReportBenchmarkResult {
  runId: string;
  runDir: string;
  reportPath: string;
}

export async function generateBenchmarkReport(
  options: ReportBenchmarkOptions
): Promise<ReportBenchmarkResult> {
  const runDir = resolveRunDir({
    runId: options.runId,
    ...(options.cwd ? { cwd: options.cwd } : {})
  });
  const manifest = await readBenchmarkManifest(runDir);
  const snapshot = await readJsonFile(
    path.join(runDir, "config.snapshot.json"),
    ConfigSnapshotSchema,
    "config.snapshot.json"
  );
  const metrics = await readJsonFile(
    path.join(runDir, "metrics.json"),
    MetricResultSchema.array(),
    "metrics.json"
  );
  const reportDir = path.join(runDir, "report");
  const reportPath = path.join(reportDir, "benchmark.md");
  await mkdir(reportDir, { recursive: true });
  await writeFile(reportPath, renderReport({ manifest, targets: snapshot.targets, metrics }), "utf8");

  return {
    runId: options.runId,
    runDir,
    reportPath
  };
}

function renderReport(input: {
  manifest: BenchmarkManifest;
  targets: Target[];
  metrics: MetricResult[];
}): string {
  const modelIds = input.manifest.models
    .map((model) => `${model.provider}/${model.modelId}`)
    .join(", ");
  const sampleCount = input.manifest.totalCells;

  return [
    "# Pharma / QMS AI Visibility Benchmark 2026",
    "",
    "## Methodology Disclosure",
    "",
    input.manifest.methodology.disclosure,
    "",
    `Scoring: ${input.manifest.methodology.scoring}`,
    "",
    `Grounded vs parametric: ${input.manifest.methodology.groundedVsParametric}`,
    "",
    `Run ID: \`${input.manifest.runId}\``,
    `Date label: ${input.manifest.dateLabel}`,
    `Model IDs: ${modelIds}`,
    `Sample count: ${sampleCount}`,
    "",
    "## Grounded vs Parametric Explanation",
    "",
    "Grounded mode represents responses that may cite source evidence. Parametric mode represents responses generated without source citations. OpenVisi keeps these modes separate in raw responses, metrics, and report tables.",
    "",
    "## Target Ranking Table",
    "",
    renderTargetRankingTable(input.targets, input.metrics),
    "",
    "## Metric Table by Vendor",
    "",
    renderMetricByVendorTable(input.metrics),
    "",
    "## Vendor Cards",
    "",
    renderVendorCards(input.metrics),
    "",
    "## Limitations",
    "",
    "- Benchmark Harness v0.1 uses deterministic rule-based metrics.",
    "- Mock provider responses are not real LLM evidence.",
    "- Provider adapters for OpenAI, Anthropic, and Gemini are placeholders until real integrations are explicitly implemented.",
    "- Mention matching is string-based and does not judge narrative accuracy.",
    "- Grounded and parametric results are separated; do not average them into a single final AI Visibility Score.",
    ""
  ].join("\n");
}

function renderTargetRankingTable(targets: Target[], metrics: MetricResult[]): string {
  const rows = targets.map((target) => ({
    target,
    groundedMention: averageMetric(metrics, target.id, "grounded", "Mention Rate"),
    parametricMention: averageMetric(metrics, target.id, "parametric", "Mention Rate"),
    groundedOfficialCitation: averageMetric(
      metrics,
      target.id,
      "grounded",
      "Official Source Citation Rate"
    ),
    competitorDisplacement: averageMetric(
      metrics,
      target.id,
      "parametric",
      "Competitor Displacement"
    )
  }));

  rows.sort((a, b) => b.groundedMention - a.groundedMention);

  return [
    "| Rank | Vendor | Category | Grounded Mention Rate | Parametric Mention Rate | Grounded Official Source Citation Rate | Parametric Competitor Displacement |",
    "|---:|---|---|---:|---:|---:|---:|",
    ...rows.map(
      (row, index) =>
        `| ${index + 1} | ${row.target.name} | ${row.target.category} | ${formatPercent(
          row.groundedMention
        )} | ${formatPercent(row.parametricMention)} | ${formatPercent(
          row.groundedOfficialCitation
        )} | ${formatPercent(row.competitorDisplacement)} |`
    )
  ].join("\n");
}

function renderMetricByVendorTable(metrics: MetricResult[]): string {
  const groups = new Map<string, MetricResult[]>();
  for (const metric of metrics) {
    const key = `${metric.provider}\t${metric.model}\t${metric.mode}\t${metric.metric}`;
    groups.set(key, [...(groups.get(key) ?? []), metric]);
  }

  const rows = [...groups.entries()].map(([key, values]) => {
    const [provider, model, mode, metric] = key.split("\t") as [string, string, string, string];
    return {
      provider,
      model,
      mode,
      metric,
      value: values.reduce((total, item) => total + item.value, 0) / values.length,
      sampleCount: values.reduce((total, item) => total + item.sampleCount, 0)
    };
  });

  rows.sort((a, b) =>
    `${a.provider}/${a.model}/${a.mode}/${a.metric}`.localeCompare(
      `${b.provider}/${b.model}/${b.mode}/${b.metric}`
    )
  );

  return [
    "| Provider | Model | Mode | Metric | Value | Samples |",
    "|---|---|---|---|---:|---:|",
    ...rows.map(
      (row) =>
        `| ${row.provider} | ${row.model} | ${row.mode} | ${row.metric} | ${formatPercent(
          row.value
        )} | ${row.sampleCount} |`
    )
  ].join("\n");
}

function renderVendorCards(metrics: MetricResult[]): string {
  const groups = new Map<string, MetricResult[]>();
  for (const metric of metrics) {
    const key = `${metric.provider}/${metric.model}/${metric.mode}`;
    groups.set(key, [...(groups.get(key) ?? []), metric]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => {
      const mentionRate = averageByMetric(values, "Mention Rate");
      const citationCoverage = averageByMetric(values, "Citation Coverage");
      const officialCitation = averageByMetric(values, "Official Source Citation Rate");
      const displacement = averageByMetric(values, "Competitor Displacement");
      return [
        `### ${key}`,
        "",
        `- Mention Rate: ${formatPercent(mentionRate)}`,
        `- Citation Coverage: ${formatPercent(citationCoverage)}`,
        `- Official Source Citation Rate: ${formatPercent(officialCitation)}`,
        `- Competitor Displacement: ${formatPercent(displacement)}`
      ].join("\n");
    })
    .join("\n\n");
}

function averageMetric(
  metrics: MetricResult[],
  targetId: string,
  mode: string,
  metricName: string
): number {
  return averageByMetric(
    metrics.filter((metric) => metric.targetId === targetId && metric.mode === mode),
    metricName
  );
}

function averageByMetric(metrics: MetricResult[], metricName: string): number {
  const matching = metrics.filter((metric) => metric.metric === metricName);
  if (matching.length === 0) return 0;
  return matching.reduce((total, metric) => total + metric.value, 0) / matching.length;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 1000) / 10}%`;
}
