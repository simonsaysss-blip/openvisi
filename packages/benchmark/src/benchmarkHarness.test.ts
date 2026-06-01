import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { estimateBenchmarkCost } from "./cost.js";
import { generateBenchmarkReport } from "./report.js";
import { runBenchmark } from "./run.js";
import { scoreBenchmark } from "./score.js";

describe("benchmark harness", () => {
  it("runs, scores, reports, and estimates cost using the deterministic mock provider", async () => {
    const cwd = await createFixtureWorkspace();

    const run = await runBenchmark({ cwd, configPath: "bench.config.json" });
    const score = await scoreBenchmark({ cwd, runId: run.runId });
    const report = await generateBenchmarkReport({ cwd, runId: run.runId });
    const cost = await estimateBenchmarkCost({ cwd, runId: run.runId });

    const files = await readdir(run.runDir);
    const metrics = JSON.parse(await readFile(score.metricsPath, "utf8")) as Array<{
      mode: string;
      metric: string;
      value: number;
    }>;
    const reportText = await readFile(report.reportPath, "utf8");
    const costJson = JSON.parse(await readFile(cost.costPath, "utf8")) as {
      totalBenchmarkCost: number | "unknown";
    };

    expect(run.runId).toBe("pharma-qms-ai-visibility-benchmark-2026");
    expect(run.completedResponses).toBe(4);
    expect(run.errorRecords).toBe(0);
    expect(files).toContain("manifest.json");
    expect(files).toContain("config.snapshot.json");
    expect(metrics.map((metric) => metric.mode)).toEqual(
      expect.arrayContaining(["grounded", "parametric"])
    );
    expect(metrics.find((metric) => metric.metric === "Mention Rate")?.value).toBe(1);
    expect(reportText).toContain("# Pharma / QMS AI Visibility Benchmark 2026");
    expect(reportText).toContain("Methodology Disclosure");
    expect(costJson.totalBenchmarkCost).toBe(0);
  });

  it("saves provider failures as error records without stopping the run", async () => {
    const cwd = await createFixtureWorkspace({
      models: [{ provider: "unsupported-provider", modelId: "nope" }]
    });

    const run = await runBenchmark({ cwd, configPath: "bench.config.json" });
    const raw = await readFile(path.join(run.runDir, "raw/responses.jsonl"), "utf8");

    expect(run.completedResponses).toBe(0);
    expect(run.errorRecords).toBe(4);
    expect(raw).toContain("\"recordType\":\"error\"");
    expect(raw).toContain("Unsupported benchmark provider");
  });
});

async function createFixtureWorkspace(configOverrides: Record<string, unknown> = {}): Promise<string> {
  const cwd = await mkdtemp(path.join(tmpdir(), "openvisi-benchmark-"));
  await mkdir(path.join(cwd, "specs"), { recursive: true });
  const config = {
    models: [{ provider: "mock", modelId: "mock-qms-v0" }],
    modes: ["grounded", "parametric"],
    samplesPerCell: 1,
    dateLabel: "Pharma / QMS AI Visibility Benchmark 2026",
    ...configOverrides
  };
  await writeFile(path.join(cwd, "bench.config.json"), `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(
    path.join(cwd, "specs/targets.json"),
    `${JSON.stringify(
      [
        {
          id: "mastercontrol",
          name: "MasterControl",
          category: "Pharma QMS",
          competitorGroup: "pharma-qms",
          officialDomains: ["mastercontrol.com"]
        }
      ],
      null,
      2
    )}\n`
  );
  await writeFile(
    path.join(cwd, "specs/prompts.json"),
    `${JSON.stringify(
      [
        {
          id: "presence",
          text: "Which QMS vendors are considered for pharma?",
          layer: "Presence",
          category: "pharma-qms",
          intentBuyer: "quality leader"
        },
        {
          id: "citation",
          text: "Which official sources should buyers inspect?",
          layer: "Citation",
          category: "pharma-qms",
          intentBuyer: "procurement analyst"
        }
      ],
      null,
      2
    )}\n`
  );
  await writeFile(
    path.join(cwd, "specs/pricing.json"),
    `${JSON.stringify(
      {
        schemaVersion: "0.1",
        currency: "USD",
        models: [
          {
            provider: "mock",
            modelId: "mock-qms-v0",
            inputUsdPer1MTokens: 0,
            outputUsdPer1MTokens: 0
          }
        ]
      },
      null,
      2
    )}\n`
  );
  return cwd;
}
